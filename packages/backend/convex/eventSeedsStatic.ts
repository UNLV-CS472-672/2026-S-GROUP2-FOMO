/**
 * Seed event list for database setup.
 *
 * Intentionally does **not** import `h3-js` (or any native/TextDecoder-heavy deps): Metro
 * can bundle shared `@fomo/backend` files into React Native, and Hermes throws on
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
  imageUrl: string;
  location: EventSeedLocation;
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
  },
];

/** Parallel to `eventSeeds` for seed-time attendee links. */
export const eventSeedAttendees = [3, 5, 4, 4, 3, 5, 2, 4, 6];
