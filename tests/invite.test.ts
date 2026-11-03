import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIcs, formatDay, formatTimeRange } from "../src/lib/format.ts";
import { STRINGS, occasionText } from "../src/lib/i18n.ts";
import { OCCASIONS, REVEALS } from "../src/lib/config.ts";
import { isValidCode, openInvite, parseFragment, randomCode, sealInvite, withGuestName } from "../src/lib/seal.ts";
import { localToUtc, parseInvite, partyIsOver, rsvpIsOpen } from "../src/lib/validate.ts";

const NOW = new Date("2026-11-03T12:00:00Z");
const base = {
  lang: "en",
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
  message: "Come over",
  dressCode: "",
  bring: "",
  songUrl: "",
  allowMaybe: true,
  maxPlusOnes: 1,
  rsvpBy: "",
  rsvpPhone: "+351 912 345 678",
  rsvpEmail: "",
};
const valid = () => {
  const r = parseInvite(base, { now: NOW });
  assert.ok(r.ok);
  return r.value;
};

test("trims text, keeps phone digits and applies the party's offset", () => {
  assert.equal(valid().title, "Summer's Last Stand");
  assert.equal(valid().rsvpPhone, "351912345678");
  assert.equal(localToUtc("2026-11-14T20:00", 180).toISOString(), "2026-11-14T23:00:00.000Z");
});

test("rejects bad invites with a translated reason and a field", () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ title: "   " }, "title"],
    [{ host: "" }, "host"],
    [{ startLocal: "2026-02-31T20:00" }, "startLocal"],
    [{ startLocal: "2026-10-01T20:00" }, "startLocal"],
    [{ endLocal: "2026-11-14T19:00" }, "endLocal"],
    [{ rsvpBy: "2026-11-20" }, "rsvpBy"],
    [{ songUrl: "javascript:alert(1)" }, "songUrl"],
    [{ rsvpPhone: "12" }, "rsvpPhone"],
    [{ rsvpEmail: "a@b.co?bcc=x@y.z" }, "rsvpEmail"],
  ];
  for (const [patch, field] of cases) {
    const r = parseInvite({ ...base, ...patch }, { now: NOW });
    assert.ok(!r.ok, JSON.stringify(patch));
    assert.equal(r.field, field);
    assert.ok(STRINGS.pt.errors[r.error], r.error);
  }
  assert.equal(parseInvite({ ...base, theme: "nope" }, { now: NOW }).ok, false);
});

test("only the right code opens an invite", async () => {
  const fragment = await sealInvite(valid(), "4821");
  const sealed = parseFragment(fragment)!;
  assert.deepEqual(await openInvite(sealed, "4821"), valid());
  assert.equal(await openInvite(sealed, "4822"), null);
  assert.equal(await openInvite(sealed, "0000"), null);
});

test("the link reveals nothing but the language", async () => {
  const fragment = await sealInvite({ ...valid(), lang: "pt" }, "4821");
  assert.equal(parseFragment(fragment)!.lang, "pt");
  const decoded = fragment.split(".").map((part) => Buffer.from(part, "base64url").toString("latin1")).join("");
  for (const secret of ["Secret", "Summer", "Maya", "351912345678"]) {
    assert.ok(!fragment.includes(secret) && !decoded.includes(secret), secret);
  }
});

test("sealing twice gives different links", async () => {
  assert.notEqual(await sealInvite(valid(), "1234"), await sealInvite(valid(), "1234"));
});

test("a typical invite link stays short enough for chat apps", async () => {
  const long = { ...valid(), message: "One long table, a lot of pasta, nowhere to be. ".repeat(6), address: "12 Secret Lane, 1200-123 Lisbon" };
  const fragment = await sealInvite(long, "1234");
  assert.ok(fragment.length < 1600, `fragment is ${fragment.length} chars`);
});

test("guest names survive the link and tampering is refused", async () => {
  const fragment = await sealInvite(valid(), "4821");
  const named = withGuestName(fragment, "João");
  assert.equal(parseFragment(named)!.to, "João");
  assert.equal(parseFragment(withGuestName(named, "Sam"))!.to, "Sam");
  assert.ok(await openInvite(parseFragment(named)!, "4821"));

  const parts = fragment.split(".");
  parts[4] = `A${parts[4].slice(1)}` === parts[4] ? `B${parts[4].slice(1)}` : `A${parts[4].slice(1)}`;
  assert.equal(await openInvite(parseFragment(parts.join("."))!, "4821"), null);
  for (const bad of ["", "#", "v2.en.a.b.c", "v1.fr.a.b.c", "v1.en.%%%.b.c", "garbage"]) {
    assert.equal(parseFragment(bad), null, bad);
  }
});

test("a crafted link with a script URL fails the same checks as the form", async () => {
  const hostile = { ...valid(), songUrl: "javascript:alert(document.domain)" };
  const raw = await openInvite(parseFragment(await sealInvite(hostile, "1234"))!, "1234");
  assert.equal(parseInvite(raw, { allowPast: true }).ok, false);
});

test("door codes are always exactly 4 digits", () => {
  for (let i = 0; i < 200; i++) assert.ok(isValidCode(randomCode()));
  for (const bad of ["", "123", "12345", "12a4", " 123"]) assert.equal(isValidCode(bad), false);
});

test("RSVPs close at the deadline and the start time", () => {
  const invite = { ...valid(), rsvpBy: "2026-11-10" };
  assert.equal(rsvpIsOpen(invite, new Date("2026-11-10T20:00:00Z")), true);
  assert.equal(rsvpIsOpen(invite, new Date("2026-11-11T12:00:00Z")), false);
  assert.equal(rsvpIsOpen({ ...invite, rsvpBy: "" }, new Date("2026-11-15T00:00:00Z")), false);
  assert.equal(partyIsOver(invite, new Date("2026-11-15T02:00:00Z")), false);
  assert.equal(partyIsOver(invite, new Date("2026-11-16T02:00:00Z")), true);
});

test("Portuguese covers every string, occasion and date format", () => {
  const keys = (o: object): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k]));
  assert.deepEqual(keys(STRINGS.pt).sort(), keys(STRINGS.en).sort());
  for (const o of OCCASIONS) {
    const pt = occasionText(o.id, "pt");
    assert.equal(pt.lines.length, o.lines.length, o.id);
    assert.notEqual(pt.lines[0], o.lines[0]);
  }
  assert.equal(REVEALS.length, 6);
  assert.equal(formatDay("2026-11-21T20:00", "pt"), "sábado, 21 de novembro");
  assert.equal(formatTimeRange("2026-11-21T20:00", "2026-11-21T23:30", "pt"), "20:00 até 23:30");
  assert.equal(formatTimeRange("2026-11-21T20:00", "2026-11-21T23:30", "en"), "8 PM to 11:30 PM");
  assert.match(STRINGS.pt.reply({ host: "Maya", name: "João", status: "yes", plusOnes: 1, note: "", title: "Festa" }), /^Oi, Maya! Aqui é João\. Eu vou em Festa \(mais 1\)!$/);
});

test("calendar files stay on wall-clock time and escape text", () => {
  const ics = buildIcs({ uid: "x", title: "A, B; C", startLocal: "2026-11-14T20:00", endLocal: "", where: "", details: "" });
  assert.match(ics, /DTSTART:20261114T200000\r\n/);
  assert.match(ics, /DTEND:20261114T230000\r\n/);
  assert.match(ics, /SUMMARY:A\\, B\; C\r\n/);
});
