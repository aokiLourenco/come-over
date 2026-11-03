import { LOCALES, type Lang } from "./i18n.ts";

// Party times are wall-clock at the venue, so they're formatted from parts and never
// shifted into the viewer's zone.

function parts(local: string) {
  const [d, t = "00:00"] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  return { y, m, day, h, min };
}

function asDate(local: string) {
  const { y, m, day, h, min } = parts(local);
  return new Date(Date.UTC(y, m - 1, day, h, min));
}

export function formatDay(local: string, lang: Lang = "en") {
  return asDate(local).toLocaleDateString(LOCALES[lang], { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

export function formatShortDay(local: string, lang: Lang = "en") {
  return asDate(local).toLocaleDateString(LOCALES[lang], { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatTime(local: string, lang: Lang = "en") {
  const { h, min } = parts(local);
  if (lang === "pt") return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  return asDate(local)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
    .replace(":00", "")
    .replace(/\s/, " ");
}

export function formatTimeRange(start: string, end: string, lang: Lang = "en") {
  const to = lang === "pt" ? "até" : "to";
  if (!end) return formatTime(start, lang);
  if (start.slice(0, 10) === end.slice(0, 10)) return `${formatTime(start, lang)} ${to} ${formatTime(end, lang)}`;
  return `${formatTime(start, lang)} ${to} ${formatShortDay(end, lang)}, ${formatTime(end, lang)}`;
}

const compact = (local: string) => local.replace(/[-:]/g, "") + "00";

function defaultEnd(start: string) {
  return new Date(asDate(start).getTime() + 3 * 3600_000).toISOString().slice(0, 16);
}

export function googleCalendarUrl(e: { title: string; startLocal: string; endLocal: string; where: string; details: string }) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${compact(e.startLocal)}/${compact(e.endLocal || defaultEnd(e.startLocal))}`,
    location: e.where,
    details: e.details,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Floating times on purpose: a party at 8 PM is at 8 PM wherever your phone is. */
export function buildIcs(e: { uid: string; title: string; startLocal: string; endLocal: string; where: string; details: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Come Over//Invite//EN",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, "")}`,
    `DTSTART:${compact(e.startLocal)}`,
    `DTEND:${compact(e.endLocal || defaultEnd(e.startLocal))}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `LOCATION:${icsEscape(e.where)}`,
    `DESCRIPTION:${icsEscape(e.details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function mapUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
