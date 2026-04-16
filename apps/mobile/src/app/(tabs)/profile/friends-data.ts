import type { ImageSourcePropType } from 'react-native';

export type FriendPost = {
  id: string;
  image: ImageSourcePropType;
  comments?: string[];
  likes?: number;
};

export type FriendPostsByTab = {
  all: FriendPost[];
  recent: FriendPost[];
  tagged: FriendPost[];
};

export type Friend = {
  id: string;
  username: string;
  realName?: string;
  imageSource: ImageSourcePropType;
  posts: FriendPostsByTab;
};

export const friends: Friend[] = [
  {
    id: 'user_1',
    username: 'PMA',
    realName: 'Nathan K',
    imageSource: require('@/assets/images/icon.png'),
    posts: {
      all: [
        {
          id: 'user_1_post_1',
          image: require('@/assets/images/icon.png'),
          comments: ['Great meetup!', 'Looks fun'],
          likes: 21,
        },
        {
          id: 'user_1_post_2',
          image: require('@/assets/images/splash-icon.png'),
          likes: 13,
        },
      ],
      recent: [
        {
          id: 'user_1_post_2',
          image: require('@/assets/images/splash-icon.png'),
          likes: 13,
        },
      ],
      tagged: [
        {
          id: 'user_1_post_1',
          image: require('@/assets/images/icon.png'),
          comments: ['Great meetup!', 'Looks fun'],
          likes: 21,
        },
      ],
    },
  },
  {
    id: 'user_2',
    username: 'heptahedron',
    imageSource: require('@/assets/images/android-icon-foreground.png'),
    posts: {
      all: [
        {
          id: 'user_2_post_1',
          image: require('@/assets/images/android-icon-foreground.png'),
          likes: 8,
        },
      ],
      recent: [
        {
          id: 'user_2_post_1',
          image: require('@/assets/images/android-icon-foreground.png'),
          likes: 8,
        },
      ],
      tagged: [],
    },
  },
  {
    id: 'user_3',
    username: 'NDP',
    realName: 'Nathan D P',
    imageSource: require('@/assets/images/android-icon-monochrome.png'),
    posts: {
      all: [
        {
          id: 'user_3_post_1',
          image: require('@/assets/images/android-icon-monochrome.png'),
          likes: 15,
        },
        {
          id: 'user_3_post_2',
          image: require('@/assets/images/icon.png'),
          comments: ['Nice shot'],
          likes: 19,
        },
      ],
      recent: [
        {
          id: 'user_3_post_2',
          image: require('@/assets/images/icon.png'),
          comments: ['Nice shot'],
          likes: 19,
        },
      ],
      tagged: [
        {
          id: 'user_3_post_1',
          image: require('@/assets/images/android-icon-monochrome.png'),
          likes: 15,
        },
      ],
    },
  },
  {
    id: 'user_4',
    username: 'Akeegaii',
    realName: 'Reecius',
    imageSource: require('@/assets/images/splash-icon.png'),
    posts: {
      all: [
        {
          id: 'user_4_post_1',
          image: require('@/assets/images/splash-icon.png'),
          likes: 34,
        },
      ],
      recent: [
        {
          id: 'user_4_post_1',
          image: require('@/assets/images/splash-icon.png'),
          likes: 34,
        },
      ],
      tagged: [],
    },
  },
  {
    id: 'user_5',
    username: 'StJimmy',
    realName: 'Jimmy D',
    imageSource: require('@/assets/images/favicon.png'),
    posts: {
      all: [
        {
          id: 'user_5_post_1',
          image: require('@/assets/images/favicon.png'),
          likes: 5,
        },
        {
          id: 'user_5_post_2',
          image: require('@/assets/images/partial-react-logo.png'),
          likes: 11,
        },
      ],
      recent: [
        {
          id: 'user_5_post_2',
          image: require('@/assets/images/partial-react-logo.png'),
          likes: 11,
        },
      ],
      tagged: [
        {
          id: 'user_5_post_1',
          image: require('@/assets/images/favicon.png'),
          likes: 5,
        },
      ],
    },
  },
  {
    id: 'user_6',
    username: 'MaymuzuD',
    realName: 'Danyella M',
    imageSource: require('@/assets/images/partial-react-logo.png'),
    posts: {
      all: [
        {
          id: 'user_6_post_1',
          image: require('@/assets/images/partial-react-logo.png'),
          comments: ['So good'],
          likes: 27,
        },
      ],
      recent: [
        {
          id: 'user_6_post_1',
          image: require('@/assets/images/partial-react-logo.png'),
          comments: ['So good'],
          likes: 27,
        },
      ],
      tagged: [],
    },
  },
];
