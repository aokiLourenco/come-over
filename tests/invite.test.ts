import assert from "node:assert/strict";
import { test } from "node:test";

process.env.DATABASE_PATH = ":memory:";

const { parseInvite, parsePhoto, parseRsvp, localToUtc } = await import("../src/lib/validate.ts");
const store = await import("../src/lib/store.ts");
const { buildIcs } = await import("../src/lib/format.ts");

const NOW = new Date("2026-11-03T12:00:00Z");
const base = {
  occasion: "house",
  reveal: "door",
  color: "cobalt",
  theme: "flyer",
  title: "  Summer's Last Stand ",
  host: "Maya",
  startLocal: "2026-11-14T20:00",
  endLocal: "",
  tzOffsetMin: 180,
  venue: "Maya's place",
  address: "12 Secret Lane",
  hideAddress: true,
  message: "Come over",
  dressCode: "",
  bring: "",
  songUrl: "",
  allowMaybe: true,
  maxPlusOnes: 1,
  showGuestList: true,
  rsvpBy: "",
};
const valid = () => {
  const r = parseInvite(base, { now: NOW });
  assert.ok(r.ok);
  return r.value;
};

test("trims text and applies the party's offset", () => {
  assert.equal(valid().title, "Summer's Last Stand");
  assert.equal(localToUtc("2026-11-14T20:00", 180).toISOString(), "2026-11-14T23:00:00.000Z");
});

test("rejects bad invites with a field to point at", () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ title: "   " }, "title"],
    [{ host: "" }, "host"],
    [{ startLocal: "2026-02-31T20:00" }, "startLocal"],
    [{ startLocal: "2026-10-01T20:00" }, "startLocal"],
    [{ endLocal: "2026-11-14T19:00" }, "endLocal"],
    [{ rsvpBy: "2026-11-20" }, "rsvpBy"],
    [{ songUrl: "javascript:alert(1)" }, "songUrl"],
  ];
  for (const [patch, field] of cases) {
    const r = parseInvite({ ...base, ...patch }, { now: NOW });
    assert.ok(!r.ok, JSON.stringify(patch));
    assert.equal(r.field, field);
  }
  assert.equal(parseInvite({ ...base, theme: "nope" }, { now: NOW }).ok, false);
});

test("hiding an address that was never entered does nothing", () => {
  const r = parseInvite({ ...base, address: "" }, { now: NOW });
  assert.ok(r.ok);
  assert.equal(r.value.hideAddress, false);
});

test("hidden address reaches a guest only after they say yes", () => {
  const { id } = store.createInvite(valid());
  const invite = store.getInvite(id)!;

  const stranger = store.toPublicInvite(invite, null, [], NOW);
  assert.equal(stranger.addressHidden, true);
  assert.ok(!JSON.stringify(stranger).includes("Secret Lane"));
  assert.ok(!("manageToken" in stranger));

  const maybe = store.saveRsvp(id, undefined, { name: "Sam", status: "maybe", plusOnes: 0, note: "" });
  const maybeView = store.toPublicInvite(invite, maybe.guest, store.listGuests(id), NOW);
  assert.ok(!JSON.stringify(maybeView).includes("Secret Lane"));

  const yes = store.saveRsvp(id, maybe.token, { name: "Sam Lee", status: "yes", plusOnes: 1, note: "" });
  const yesView = store.toPublicInvite(invite, yes.guest, store.listGuests(id), NOW);
  assert.equal(yesView.address, "12 Secret Lane");
  assert.equal(yesView.addressHidden, false);
  assert.deepEqual(yesView.goingNames, ["Sam"]);
  assert.equal(yesView.goingCount, 2);
});

test("a token from another party can't edit this party's RSVP", () => {
  const a = store.createInvite(valid());
  const b = store.createInvite(valid());
  const first = store.saveRsvp(a.id, undefined, { name: "Ann", status: "yes", plusOnes: 0, note: "" });
  const second = store.saveRsvp(b.id, first.token, { name: "Bob", status: "no", plusOnes: 0, note: "" });
  assert.notEqual(second.token, first.token);
  assert.equal(store.listGuests(a.id)[0].name, "Ann");
  assert.equal(store.getGuestByToken(b.id, first.token), null);
});

test("RSVPs close at the deadline and at the start time", () => {
  const invite = { ...valid(), rsvpBy: "2026-11-10" };
  assert.equal(store.rsvpIsOpen(invite, new Date("2026-11-10T20:00:00Z")), true);
  assert.equal(store.rsvpIsOpen(invite, new Date("2026-11-11T12:00:00Z")), false);
  assert.equal(store.rsvpIsOpen({ ...invite, rsvpBy: "" }, new Date("2026-11-15T00:00:00Z")), false);
});

test("RSVP rules follow the host's settings", () => {
  assert.equal(parseRsvp({ name: "", status: "yes" }, { allowMaybe: true, maxPlusOnes: 1 }).ok, false);
  assert.equal(parseRsvp({ name: "A", status: "maybe" }, { allowMaybe: false, maxPlusOnes: 1 }).ok, false);
  const r = parseRsvp({ name: "A", status: "yes", plusOnes: 9 }, { allowMaybe: true, maxPlusOnes: 2 });
  assert.ok(r.ok);
  assert.equal(r.value.plusOnes, 2);
  const no = parseRsvp({ name: "A", status: "no", plusOnes: 2 }, { allowMaybe: true, maxPlusOnes: 2 });
  assert.ok(no.ok);
  assert.equal(no.value.plusOnes, 0);
});

test("photo must match its claimed type", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]).toString("base64");
  assert.ok(parsePhoto(`data:image/jpeg;base64,${jpeg}`).ok);
  const html = Buffer.from("<script>alert(1)</script>").toString("base64");
  assert.equal(parsePhoto(`data:image/jpeg;base64,${html}`).ok, false);
  assert.equal(parsePhoto(`data:text/html;base64,${html}`).ok, false);
});

test("deleting an invite removes its guests", () => {
  const { id } = store.createInvite(valid());
  store.saveRsvp(id, undefined, { name: "Ann", status: "yes", plusOnes: 0, note: "" });
  store.deleteInvite(id);
  assert.equal(store.getInvite(id), null);
  assert.equal(store.listGuests(id).length, 0);
});

test("calendar files stay on wall-clock time and escape text", () => {
  const ics = buildIcs({
    uid: "x",
    title: "A, B; C",
    startLocal: "2026-11-14T20:00",
    endLocal: "",
    where: "",
    details: "",
  });
  assert.match(ics, /DTSTART:20261114T200000\r\n/);
  assert.match(ics, /DTEND:20261114T230000\r\n/);
  assert.match(ics, /SUMMARY:A\\, B\; C\r\n/);
});
