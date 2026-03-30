export type AvatarTone = 'amber' | 'sky' | 'emerald' | 'rose' | 'indigo' | 'cyan';

export type SampleSocialProfile = {
  handle: string;
  username: string;
  realName?: string;
  avatarTone: AvatarTone;
};

export type SampleProfileEvent = {
  title: string;
  imageSrc: string;
};

export const sampleRecommendedFriends: SampleSocialProfile[] = [
  {
    handle: 'barfspoon',
    username: 'barfspoon',
    realName: 'Broxtin',
    avatarTone: 'amber',
  },
  {
    handle: 'spongoi-endless-suffering',
    username: 'spongoi endless suffering',
    avatarTone: 'sky',
  },
  {
    handle: 'spongoi-man-failure',
    username: 'spongoi man failure',
    realName: 'Koiyne',
    avatarTone: 'cyan',
  },
  {
    handle: 'spongoi-baby-drives-many-cars',
    username: 'spongoi baby drives many cars',
    realName: 'Ryuji Gouda',
    avatarTone: 'emerald',
  },
  {
    handle: 'stjimmy',
    username: 'StJimmy',
    realName: 'Jimmy D',
    avatarTone: 'rose',
  },
];

export const sampleFriends: SampleSocialProfile[] = [
  {
    handle: 'pma',
    username: 'PMA',
    realName: 'Nathan K',
    avatarTone: 'amber',
  },
  {
    handle: 'heptahedron',
    username: 'heptahedron',
    avatarTone: 'indigo',
  },
  {
    handle: 'jonahmog',
    username: 'jonahmog',
    realName: 'Jonah Mog',
    avatarTone: 'sky',
  },
  {
    handle: 'manjotlemon',
    username: 'manjotlemon',
    realName: 'Manjot Lemon',
    avatarTone: 'emerald',
  },
  {
    handle: 'ndp',
    username: 'NDP',
    realName: 'Nathan D P',
    avatarTone: 'rose',
  },
  {
    handle: 'akeegaii',
    username: 'Akeegaii',
    realName: 'Reecius',
    avatarTone: 'cyan',
  },
  {
    handle: 'maymuzud',
    username: 'MaymuzuD',
    realName: 'Danyella M',
    avatarTone: 'amber',
  },
];

export const samplePastEvents: SampleProfileEvent[] = [
  {
    title: 'Late Night DJ Set',
    imageSrc: '/profile-events/late-night-dj-set.svg',
  },
  {
    title: 'Campus Pop-Up',
    imageSrc: '/profile-events/campus-pop-up.svg',
  },
  {
    title: 'Indie Showcase',
    imageSrc: '/profile-events/indie-showcase.svg',
  },
  {
    title: 'Sunday Brunch',
    imageSrc: '/profile-events/sunday-brunch.svg',
  },
];
