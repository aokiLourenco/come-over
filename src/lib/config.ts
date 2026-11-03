export const BRAND = "Come Over";

export type RevealId = "door" | "pinata" | "popper" | "envelope" | "disco" | "ticket";
export type ThemeId = "flyer" | "disco" | "gingham" | "sprinkles" | "blacktie" | "cloud";
export type ColorId = "cobalt" | "cherry" | "tangerine" | "mint" | "bubblegum" | "midnight";
export type OccasionId =
  | "birthday"
  | "house"
  | "dinner"
  | "baby"
  | "engagement"
  | "graduation"
  | "holiday"
  | "games";

export const REVEALS: { id: RevealId; label: string; blurb: string }[] = [
  { id: "door", label: "Front Door", blurb: "They knock three times. The door swings open on your party." },
  { id: "pinata", label: "Piñata", blurb: "A few good whacks and the invite falls out with the candy." },
  { id: "popper", label: "Party Popper", blurb: "They pull the string. Bang, confetti, and the invite shoots out." },
  { id: "envelope", label: "Wax Seal", blurb: "They crack the seal, the flap lifts and the invite slides out." },
  { id: "disco", label: "Disco Ball", blurb: "They pull the cord in a dark room. The ball drops and the lights start." },
  { id: "ticket", label: "Scratch Ticket", blurb: "They scratch the foil off a ticket with their name on the list." },
];

export const COLORS: { id: ColorId; label: string; hex: string; deep: string; wall: string; floor: string }[] = [
  { id: "cobalt", label: "Cobalt", hex: "#2A32D8", deep: "#1C1A9E", wall: "#FFC928", floor: "#1C1A9E" },
  { id: "cherry", label: "Cherry", hex: "#E3263A", deep: "#9C1024", wall: "#FFE3D6", floor: "#6B1020" },
  { id: "tangerine", label: "Tangerine", hex: "#FF7A1A", deep: "#C24E00", wall: "#D9F2FF", floor: "#17406B" },
  { id: "mint", label: "Mint", hex: "#10B58C", deep: "#0A7A5E", wall: "#FFE0EC", floor: "#0B5B47" },
  { id: "bubblegum", label: "Bubblegum", hex: "#FF5CA8", deep: "#C72A78", wall: "#EDE6FF", floor: "#4A2AA8" },
  { id: "midnight", label: "Midnight", hex: "#2B2170", deep: "#17103A", wall: "#BFD7FF", floor: "#17103A" },
];

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "flyer", label: "Flyer" },
  { id: "disco", label: "Disco" },
  { id: "gingham", label: "Gingham" },
  { id: "sprinkles", label: "Sprinkles" },
  { id: "blacktie", label: "Black Tie" },
  { id: "cloud", label: "Cloud" },
];

export const OCCASIONS: {
  id: OccasionId;
  label: string;
  titleHint: string;
  theme: ThemeId;
  reveal: RevealId;
  color: ColorId;
  lines: string[];
}[] = [
  {
    id: "birthday",
    label: "Birthday",
    titleHint: "Maya's 30th",
    theme: "sprinkles",
    reveal: "pinata",
    color: "bubblegum",
    lines: [
      "I'm turning another year older and I refuse to do it alone.",
      "Cake, loud music, and everyone I like in one room. Be there.",
      "No gifts. Just show up and dance badly with me.",
      "Help me eat a cake that's far too big for one person.",
      "It's my birthday and you're legally required to come.",
      "Bring your best story about me. The embarrassing ones count double.",
    ],
  },
  {
    id: "house",
    label: "House Party",
    titleHint: "Summer's Last Stand",
    theme: "flyer",
    reveal: "door",
    color: "cobalt",
    lines: [
      "The neighbors are away and the speakers are ready.",
      "Come over. Stay late. Help me finish the snacks.",
      "We got a new place and it needs to hear some noise.",
      "Nothing fancy. Good people, cold drinks, a playlist that takes requests.",
      "Doors open at 8. The good stuff runs out by 10.",
      "It's a housewarming, so please warm the house.",
    ],
  },
  {
    id: "dinner",
    label: "Dinner",
    titleHint: "Sunday Supper",
    theme: "gingham",
    reveal: "envelope",
    color: "cherry",
    lines: [
      "I'm cooking too much food again. Come help.",
      "One long table, a lot of pasta, nowhere to be.",
      "Save your appetite and your best gossip.",
      "Pull up a chair. There's always room for one more.",
      "Dinner's at mine. Tell me what you can't eat and I'll work around it.",
      "Good wine, slow food, phones in the bowl by the door.",
    ],
  },
  {
    id: "baby",
    label: "Baby Shower",
    titleHint: "Baby Nguyen Is Coming",
    theme: "cloud",
    reveal: "envelope",
    color: "mint",
    lines: [
      "A tiny new person is on the way. Come celebrate with us.",
      "Join us for cake, silly games and very small socks.",
      "We can't wait for you to meet the bump before you meet the baby.",
      "Help us get ready for the littlest guest we've ever invited.",
      "Come shower us with love. Advice is optional.",
      "Snacks, stories and one last nap for the parents-to-be.",
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    titleHint: "Priya & Tom Said Yes",
    theme: "blacktie",
    reveal: "envelope",
    color: "midnight",
    lines: [
      "We said yes. Now come raise a glass with us.",
      "We're getting married and we'd love to celebrate with you first.",
      "Join us for a night of toasts, dancing and happy tears.",
      "You've been part of our story. Come be part of this night.",
      "One ring, two very happy people, and an open bar.",
      "We're making it official. Help us make it a party.",
    ],
  },
  {
    id: "graduation",
    label: "Graduation",
    titleHint: "Jordan Finally Graduated",
    theme: "flyer",
    reveal: "popper",
    color: "tangerine",
    lines: [
      "Four years, one diploma, and a party that's long overdue.",
      "Caps off. Come celebrate before the real world starts.",
      "I did it. Come eat cake about it.",
      "Thanks for getting me through. Let me feed you.",
      "Help me celebrate the end of homework forever.",
      "We're so proud of our grad. Come tell them yourself.",
    ],
  },
  {
    id: "holiday",
    label: "Holiday Party",
    titleHint: "The Big Holiday Thing",
    theme: "disco",
    reveal: "disco",
    color: "midnight",
    lines: [
      "Ugly sweaters encouraged. Good cheer required.",
      "Let's see the year out properly, with sparkle.",
      "Mulled drinks, terrible carols, excellent company.",
      "One night off from the chaos. Come celebrate with us.",
      "Dress up, show up, and help us finish the cookies.",
      "It's the most wonderful time of the year to come over.",
    ],
  },
  {
    id: "games",
    label: "Game Night",
    titleHint: "Friday Game Night",
    theme: "flyer",
    reveal: "ticket",
    color: "mint",
    lines: [
      "Board games, snacks and a friendly amount of trash talk.",
      "Last place buys the pizza next time.",
      "Bring your favorite game and your worst poker face.",
      "Friendships will be tested. Come anyway.",
      "Teams get picked at 7. Don't be late or you're with me.",
      "Winner keeps the trophy. It's a very small trophy.",
    ],
  },
];

export const LIMITS = {
  title: 60,
  host: 60,
  venue: 80,
  address: 160,
  message: 600,
  dressCode: 80,
  bring: 120,
  songUrl: 300,
  guestName: 60,
  guestNote: 200,
  maxPlusOnes: 5,
  photoBytes: 3 * 1024 * 1024,
};

export function occasionById(id: string) {
  return OCCASIONS.find((o) => o.id === id);
}
export function colorById(id: string) {
  return COLORS.find((c) => c.id === id) ?? COLORS[0];
}
