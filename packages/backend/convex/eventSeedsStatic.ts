/**
 * Pure mock event list for Convex queries and for the mobile app search UI.
 *
 * Intentionally does **not** import `h3-js` (or any native/TextDecoder-heavy deps): Metro
 * bundles shared `@fomo/backend` files into React Native, and Hermes throws on
 * `TextDecoder('utf-16le')` when `h3-js` loads.
 *
 * H3 indices below are precomputed at resolution 9 to match `latLngToH3Index` in `data_ml/events.ts`.
 */

export type EventSeedLocation = {
  latitude: number;
  longitude: number;
  h3Index: string;
};

export type EventSeed = {
  name: string;
  organization: string;
  description: string;
  location: EventSeedLocation;
};

/** Stable id for mock / seeded list events until we load real `events` documents. */
export function mockEventIdForSeedIndex(index: number): string {
  return `mock:event:${index}`;
}

export const eventSeeds: EventSeed[] = [
  {
    name: 'Coffee + Homework',
    organization: 'Pop Cafe',
    description: 'Chill study session.',
    location: {
      latitude: 36.12730186736902,
      longitude: -115.19299595922035,
      h3Index: '892986b810bffff',
    },
  },
  {
    name: 'ASAP Rocky Concert',
    organization: 'ASAP Rocky',
    description: 'Dont be dumb, pull up.',
    location: {
      latitude: 36.10470771447518,
      longitude: -115.16859227452814,
      h3Index: '892986b846fffff',
    },
  },
  {
    name: 'Psi Rho house party',
    organization: 'UNLV - Alpha Psi Rho',
    description: 'no hazing, just good vibes. $10 entry for dudes.',
    location: {
      latitude: 36.10790291877858,
      longitude: -115.14269190902489,
      h3Index: '892986b8673ffff',
    },
  },
  {
    name: 'Las Vegas - First Friday',
    organization: 'Downtown Las Vegas',
    description:
      'Free-admission monthly event featuring live music, art exhibits, food trucks, and vendors.',
    location: {
      latitude: 36.15958759998514,
      longitude: -115.15239854806732,
      h3Index: '892986b9893ffff',
    },
  },
  {
    name: 'St. Jimmy Panel & Conference',
    organization: 'st. jimmy',
    description:
      'okay jeez, i been going thru a rough patch. going left, right thru the catacombs.',
    location: {
      latitude: 36.09086216508982,
      longitude: -115.18328464909499,
      h3Index: '892986b84a3ffff',
    },
  },
  {
    name: 'LVL UP EXPO 2026',
    organization: 'LVL UP LLC',
    description:
      'LVL UP EXPO is a three-day immersive gaming and pop culture convention in Las Vegas celebrating fans through esports tournaments, cosplay, art, and entertainment.',
    location: {
      latitude: 36.12871445143533,
      longitude: -115.15149229313623,
      h3Index: '892986b8207ffff',
    },
  },
  {
    name: 'Baby Keem Concert',
    organization: 'The Cosmopolitan',
    description: 'half past twelve i was all alone.',
    location: {
      latitude: 36.10987909759377,
      longitude: -115.17538973403965,
      h3Index: '892986b808fffff',
    },
  },
  {
    name: 'Water Lantern Festival',
    organization: 'SWCTA Key Club',
    description: 'Join us at Sunset Park to litter the pond.',
    location: {
      latitude: 36.03809903957797,
      longitude: -115.24699453074136,
      h3Index: '892986b1673ffff',
    },
  },
  {
    name: 'Thrift Valley pop up shop',
    organization: 'Thrift Valley',
    description: 'we outta stussy dont even ask',
    location: {
      latitude: 36.15909747099756,
      longitude: -115.15269829421878,
      h3Index: '892986b9c2fffff',
    },
  },

  // New events to test rec engine
  {
    name: 'Chinatown Night Market',
    organization: 'Las Vegas Chinatown Plaza',
    description:
      'Street food, vendors, live music, and cultural performances in the heart of Chinatown.',
    location: {
      latitude: 36.12201837345691,
      longitude: -115.19872034567823,
      h3Index: '892986b8113ffff',
    },
  },
  {
    name: 'UNLV Career & Culture Fair',
    organization: 'UNLV Student Affairs',
    description:
      'Network with employers, student orgs, and campus resources. Free food and giveaways.',
    location: {
      latitude: 36.10812345678901,
      longitude: -115.14123456789012,
      h3Index: '892986b8647ffff',
    },
  },
  {
    name: 'Vegas Streetwear Market',
    organization: 'Desert Drip Collective',
    description:
      'Local and independent streetwear brands, vintage fits, and live customization booths.',
    location: {
      latitude: 36.16234567890123,
      longitude: -115.14567890123456,
      h3Index: '892986b989bffff',
    },
  },
  {
    name: 'Desert Rap Cypher',
    organization: 'Vegas Underground',
    description: 'Open mic rap cypher. Bring your bars or just pull up and vibe. No gatekeeping.',
    location: {
      latitude: 36.15123456789012,
      longitude: -115.16234567890123,
      h3Index: '892986b9ddbffff',
    },
  },
  {
    name: 'Downtown Art Walk',
    organization: '18b Arts District',
    description:
      'Self-guided tour of galleries, murals, and pop-up installations across the 18b Arts District.',
    location: {
      latitude: 36.17234567890123,
      longitude: -115.14890123456789,
      h3Index: '892986b9803ffff',
    },
  },
  {
    name: 'Sunset Chill Fest',
    organization: 'Sunset Park Events',
    description:
      'Laid-back outdoor hangout with food trucks, r&b sets, and lawn games at Sunset Park.',
    location: {
      latitude: 36.03912345678901,
      longitude: -115.14678901234567,
      h3Index: '89298685b73ffff',
    },
  },
  {
    name: 'Neon Birthday Bash',
    organization: 'Private Event',
    description: 'Annual neon-themed birthday party. BYOF (bring your own fits). Open bar for 21+.',
    location: {
      latitude: 36.11456789012345,
      longitude: -115.17123456789012,
      h3Index: '892986b8003ffff',
    },
  },
  {
    name: 'UNLV Anime Club Screening',
    organization: 'UNLV Anime Club',
    description:
      'Monthly screening night. This month: Frieren. Snacks provided, cosplay encouraged.',
    location: {
      latitude: 36.10678901234567,
      longitude: -115.14234567890123,
      h3Index: '892986b8647ffff',
    },
  },
];

/** Parallel to `eventSeeds` — used by seed handler and mobile search. */
export const eventSeedAttendees = [3, 5, 4, 4, 3, 5, 2, 4, 6];
