import type { ImageSourcePropType } from 'react-native';

type FriendPost = {
  id: string;
  image: ImageSourcePropType;
};

export type FriendProfile = {
  username: string;
  realName?: string;
  imageSource: ImageSourcePropType;
  bio: string;
  stats: {
    postCount: number;
    friendCount: number;
    eventCount: number;
  };
  posts: {
    all: FriendPost[];
    recent: FriendPost[];
    tagged: FriendPost[];
  };
};

const imageIcon = require('@/assets/images/icon.png');
const imageReactLogo = require('@/assets/images/react-logo.png');
const imageAndroidForeground = require('@/assets/images/android-icon-foreground.png');
const imageAndroidMonochrome = require('@/assets/images/android-icon-monochrome.png');
const imageSplash = require('@/assets/images/splash-icon.png');
const imageFavicon = require('@/assets/images/favicon.png');
const imagePartialReact = require('@/assets/images/partial-react-logo.png');

export const recommendedFriends: FriendProfile[] = [
  {
    username: 'barfspoon',
    realName: 'Broxtin',
    imageSource: imageIcon,
    bio: 'Always around for late-night food runs and bad ideas that somehow work out.',
    stats: {
      postCount: 8,
      friendCount: 18,
      eventCount: 4,
    },
    posts: {
      all: [
        { id: 'barfspoon-1', image: imageIcon },
        { id: 'barfspoon-2', image: imageReactLogo },
      ],
      recent: [{ id: 'barfspoon-1', image: imageIcon }],
      tagged: [{ id: 'barfspoon-2', image: imageReactLogo }],
    },
  },
  {
    username: 'spongoi endless suffering',
    imageSource: imageReactLogo,
    bio: 'Posting through it one meme and one event at a time.',
    stats: {
      postCount: 5,
      friendCount: 9,
      eventCount: 2,
    },
    posts: {
      all: [
        { id: 'spongoi-1', image: imageReactLogo },
        { id: 'spongoi-2', image: imagePartialReact },
      ],
      recent: [{ id: 'spongoi-1', image: imageReactLogo }],
      tagged: [{ id: 'spongoi-2', image: imagePartialReact }],
    },
  },
  {
    username: 'spongoi man failure',
    realName: 'Koiyne',
    imageSource: imageReactLogo,
    bio: 'Low battery, high commitment, still makes it to every plan.',
    stats: {
      postCount: 11,
      friendCount: 15,
      eventCount: 6,
    },
    posts: {
      all: [
        { id: 'failure-1', image: imageReactLogo },
        { id: 'failure-2', image: imageAndroidForeground },
      ],
      recent: [{ id: 'failure-1', image: imageReactLogo }],
      tagged: [{ id: 'failure-2', image: imageAndroidForeground }],
    },
  },
  {
    username: 'spongoi baby drives many cars',
    realName: 'Ryuji Gouda',
    imageSource: imageReactLogo,
    bio: 'If there is a meetup across town, there is a good chance he drove there already.',
    stats: {
      postCount: 7,
      friendCount: 12,
      eventCount: 5,
    },
    posts: {
      all: [
        { id: 'cars-1', image: imageReactLogo },
        { id: 'cars-2', image: imageSplash },
      ],
      recent: [{ id: 'cars-1', image: imageReactLogo }],
      tagged: [{ id: 'cars-2', image: imageSplash }],
    },
  },
];

export const friends: FriendProfile[] = [
  {
    username: 'PMA',
    realName: 'Nathan K',
    imageSource: imageIcon,
    bio: 'Keeps the group on schedule and still somehow finds time to go out.',
    stats: {
      postCount: 14,
      friendCount: 24,
      eventCount: 7,
    },
    posts: {
      all: [
        { id: 'pma-1', image: imageIcon },
        { id: 'pma-2', image: imageAndroidForeground },
        { id: 'pma-3', image: imagePartialReact },
      ],
      recent: [{ id: 'pma-1', image: imageIcon }],
      tagged: [{ id: 'pma-3', image: imagePartialReact }],
    },
  },
  {
    username: 'heptahedron',
    imageSource: imageAndroidForeground,
    bio: 'Usually quiet until the plan needs someone to actually make it happen.',
    stats: {
      postCount: 6,
      friendCount: 13,
      eventCount: 3,
    },
    posts: {
      all: [
        { id: 'heptahedron-1', image: imageAndroidForeground },
        { id: 'heptahedron-2', image: imageReactLogo },
      ],
      recent: [{ id: 'heptahedron-1', image: imageAndroidForeground }],
      tagged: [{ id: 'heptahedron-2', image: imageReactLogo }],
    },
  },
  {
    username: 'NDP',
    realName: 'Nathan D P',
    imageSource: imageAndroidMonochrome,
    bio: 'Equal parts planner and menace, depending on the group chat mood.',
    stats: {
      postCount: 10,
      friendCount: 19,
      eventCount: 4,
    },
    posts: {
      all: [
        { id: 'ndp-1', image: imageAndroidMonochrome },
        { id: 'ndp-2', image: imageIcon },
      ],
      recent: [{ id: 'ndp-1', image: imageAndroidMonochrome }],
      tagged: [{ id: 'ndp-2', image: imageIcon }],
    },
  },
  {
    username: 'Akeegaii',
    realName: 'Reecius',
    imageSource: imageSplash,
    bio: 'Always knows where the good event is before everybody else does.',
    stats: {
      postCount: 17,
      friendCount: 28,
      eventCount: 9,
    },
    posts: {
      all: [
        { id: 'akeegaii-1', image: imageSplash },
        { id: 'akeegaii-2', image: imageFavicon },
      ],
      recent: [{ id: 'akeegaii-1', image: imageSplash }],
      tagged: [{ id: 'akeegaii-2', image: imageFavicon }],
    },
  },
  {
    username: 'StJimmy',
    realName: 'Jimmy D',
    imageSource: imageFavicon,
    bio: 'Shows up with opinions, leaves with the best photos from the night.',
    stats: {
      postCount: 9,
      friendCount: 16,
      eventCount: 5,
    },
    posts: {
      all: [
        { id: 'stjimmy-1', image: imageFavicon },
        { id: 'stjimmy-2', image: imageIcon },
      ],
      recent: [{ id: 'stjimmy-1', image: imageFavicon }],
      tagged: [{ id: 'stjimmy-2', image: imageIcon }],
    },
  },
  {
    username: 'MaymuzuD',
    realName: 'Danyella M',
    imageSource: imagePartialReact,
    bio: 'Finds the cool places first and makes everyone else wish they had gone sooner.',
    stats: {
      postCount: 12,
      friendCount: 21,
      eventCount: 6,
    },
    posts: {
      all: [
        { id: 'maymuzud-1', image: imagePartialReact },
        { id: 'maymuzud-2', image: imageReactLogo },
      ],
      recent: [{ id: 'maymuzud-1', image: imagePartialReact }],
      tagged: [{ id: 'maymuzud-2', image: imageReactLogo }],
    },
  },
];

export const allFriendProfiles = [...recommendedFriends, ...friends];
