/**
 * Seed event list for database setup.
 *
 * Intentionally does **not** import `h3-js` (or any native/TextDecoder-heavy deps): Metro
 * can bundle shared `@fomo/backend` files into React Native, and Hermes throws on
 * `TextDecoder('utf-16le')` when `h3-js` loads.
 *
 * H3 indices below are precomputed at resolution 9 to match `latLngToH3Index` in `events.ts`.
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
  imageUrl: string;
  location: EventSeedLocation;
  startDate: number;
  endDate: number;
};

export const eventSeeds: EventSeed[] = [
  {
    name: 'Coffee + Homework',
    organization: 'Pop Cafe',
    description: 'Chill study session.',
    imageUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.12730186736902,
      longitude: -115.19299595922035,
      h3Index: '892986b810bffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'ASAP Rocky Concert',
    organization: 'ASAP Rocky',
    description: 'Dont be dumb, pull up.',
    imageUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.10470771447518,
      longitude: -115.16859227452814,
      h3Index: '892986b846fffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Psi Rho house party',
    organization: 'UNLV - Alpha Psi Rho',
    description: 'no hazing, just good vibes. $10 entry for dudes.',
    imageUrl:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.10790291877858,
      longitude: -115.14269190902489,
      h3Index: '892986b8673ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Las Vegas - First Friday',
    organization: 'Downtown Las Vegas',
    description:
      'Free-admission monthly event featuring live music, art exhibits, food trucks, and vendors.',
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.15958759998514,
      longitude: -115.15239854806732,
      h3Index: '892986b9893ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'St. Jimmy Panel & Conference',
    organization: 'st. jimmy',
    description:
      'okay jeez, i been going thru a rough patch. going left, right thru the catacombs.',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.09086216508982,
      longitude: -115.18328464909499,
      h3Index: '892986b84a3ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'LVL UP EXPO 2026',
    organization: 'LVL UP LLC',
    description:
      'LVL UP EXPO is a three-day immersive gaming and pop culture convention in Las Vegas celebrating fans through esports tournaments, cosplay, art, and entertainment.',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.12871445143533,
      longitude: -115.15149229313623,
      h3Index: '892986b8207ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Baby Keem Concert',
    organization: 'The Cosmopolitan',
    description: 'half past twelve i was all alone.',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.10987909759377,
      longitude: -115.17538973403965,
      h3Index: '892986b808fffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Water Lantern Festival',
    organization: 'SWCTA Key Club',
    description: 'Join us at Sunset Park to litter the pond.',
    imageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.03809903957797,
      longitude: -115.24699453074136,
      h3Index: '892986b1673ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Thrift Valley pop up shop',
    organization: 'Thrift Valley',
    description: 'we outta stussy dont even ask',
    imageUrl:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.15909747099756,
      longitude: -115.15269829421878,
      h3Index: '892986b9c2fffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },

  // New events to test rec engine
  {
    name: 'Chinatown Night Market',
    organization: 'Las Vegas Chinatown Plaza',
    description:
      'Street food, vendors, live music, and cultural performances in the heart of Chinatown.',
    imageUrl:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.12201837345691,
      longitude: -115.19872034567823,
      h3Index: '892986b8113ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'UNLV Career & Culture Fair',
    organization: 'UNLV Student Affairs',
    description:
      'Network with employers, student orgs, and campus resources. Free food and giveaways.',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.10812345678901,
      longitude: -115.14123456789012,
      h3Index: '892986b8647ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Vegas Streetwear Market',
    organization: 'Desert Drip Collective',
    description:
      'Local and independent streetwear brands, vintage fits, and live customization booths.',
    imageUrl:
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.16234567890123,
      longitude: -115.14567890123456,
      h3Index: '892986b989bffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Desert Rap Cypher',
    organization: 'Vegas Underground',
    description: 'Open mic rap cypher. Bring your bars or just pull up and vibe. No gatekeeping.',
    imageUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.15123456789012,
      longitude: -115.16234567890123,
      h3Index: '892986b9ddbffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Downtown Art Walk',
    organization: '18b Arts District',
    description:
      'Self-guided tour of galleries, murals, and pop-up installations across the 18b Arts District.',
    imageUrl:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.17234567890123,
      longitude: -115.14890123456789,
      h3Index: '892986b9803ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Sunset Chill Fest',
    organization: 'Sunset Park Events',
    description:
      'Laid-back outdoor hangout with food trucks, r&b sets, and lawn games at Sunset Park.',
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.03912345678901,
      longitude: -115.14678901234567,
      h3Index: '89298685b73ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'Neon Birthday Bash',
    organization: 'Private Event',
    description: 'Annual neon-themed birthday party. BYOF (bring your own fits). Open bar for 21+.',
    imageUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.11456789012345,
      longitude: -115.17123456789012,
      h3Index: '892986b8003ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
  {
    name: 'UNLV Anime Club Screening',
    organization: 'UNLV Anime Club',
    description:
      'Monthly screening night. This month: Frieren. Snacks provided, cosplay encouraged.',
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 36.10678901234567,
      longitude: -115.14234567890123,
      h3Index: '892986b8647ffff',
    },
    startDate: Date.now() + 24 * 60 * 60 * 1000,
    endDate: Date.now() + 26 * 60 * 60 * 1000,
  },
];

/** Parallel to `eventSeeds` for seed-time attendee links. */
export const eventSeedAttendees = [3, 5, 4, 4, 3, 5, 2, 4, 6];
