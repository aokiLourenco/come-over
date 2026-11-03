import type { ColorId, OccasionId, RevealId, ThemeId } from "./config.ts";

export type RsvpStatus = "yes" | "maybe" | "no";

/** Everything the host fills in. Dates are wall-clock at the party, never converted. */
export type InviteInput = {
  occasion: OccasionId;
  reveal: RevealId;
  color: ColorId;
  theme: ThemeId;
  title: string;
  host: string;
  startLocal: string; // 2026-11-14T20:00
  endLocal: string; // "" when open-ended
  tzOffsetMin: number; // JS getTimezoneOffset() at startLocal
  venue: string;
  address: string;
  hideAddress: boolean;
  message: string;
  dressCode: string;
  bring: string;
  songUrl: string;
  allowMaybe: boolean;
  maxPlusOnes: number;
  showGuestList: boolean;
  rsvpBy: string; // 2026-11-10 or ""
};

export type Invite = InviteInput & {
  id: string;
  manageToken: string;
  hasPhoto: boolean;
  photoVersion: number;
  views: number;
  createdAt: string;
};

export type Guest = {
  id: string;
  name: string;
  status: RsvpStatus;
  plusOnes: number;
  note: string;
  updatedAt: string;
};

/** What a guest is allowed to see. Built only by toPublicInvite(). */
export type PublicInvite = Omit<Invite, "manageToken" | "views" | "tzOffsetMin" | "address" | "hideAddress"> & {
  address: string;
  addressHidden: boolean;
  startUtc: string;
  rsvpOpen: boolean;
  isOver: boolean;
  goingNames: string[];
  goingCount: number;
};
