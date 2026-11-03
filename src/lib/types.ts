import type { ColorId, OccasionId, RevealId, ThemeId } from "./config.ts";
import type { Lang, Status } from "./i18n.ts";

export type { Status };

/** The whole invite. It travels encrypted inside the link, so there is no server copy. */
export type InviteInput = {
  lang: Lang;
  occasion: OccasionId;
  reveal: RevealId;
  color: ColorId;
  theme: ThemeId;
  title: string;
  host: string;
  startLocal: string; // 2026-11-14T20:00, wall-clock at the party
  endLocal: string; // "" when open-ended
  tzOffsetMin: number; // JS getTimezoneOffset() at startLocal
  venue: string;
  address: string;
  message: string;
  dressCode: string;
  bring: string;
  songUrl: string;
  allowMaybe: boolean;
  maxPlusOnes: number;
  rsvpBy: string; // 2026-11-10 or ""
  rsvpPhone: string; // digits with country code, or ""
  rsvpEmail: string;
};

export type Reply = { name: string; status: Status; plusOnes: number; note: string };
