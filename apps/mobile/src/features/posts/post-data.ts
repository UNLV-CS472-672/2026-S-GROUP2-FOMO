export type Post = {
  id: string;
  image: any;
  comments?: string[];
  likes?: number;
};

export const allPosts: Post[] = [
  {
    id: '1',
    image: require('@/assets/images/icon.png'),
    comments: ['I hate my life', 'Help please', 'Comment', 'Comment', 'Comment', 'Comment'],
    likes: 42,
  },
  {
    id: '2',
    image: require('@/assets/images/icon.png'),
    comments: ['This is a cry for help', 'I hate merge conflicts'],
    likes: 30,
  },
  {
    id: '3',
    image: require('@/assets/images/icon.png'),
    comments: [
      'I have to lock in, I HAVE TO LOCK IN,  I HAVE TO LOCK IN, I HAVE TO LOCK IN, I HAVE TO LOCK IN, I HAVE TO LOCK IN, I HAVE TO LOCK IN,',
      'Awesome!',
    ],
    likes: 25,
  },
  {
    id: '4',
    image: require('@/assets/images/icon.png'),
    comments: ['New post!', 'Looks great!'],
    likes: 15,
  },
  {
    id: '5',
    image: require('@/assets/images/icon.png'),
    comments: ['Love it!', 'Fantastic!'],
    likes: 20,
  },
  {
    id: '6',
    image: require('@/assets/images/icon.png'),
    comments: ['Tagged you!', 'So fun!'],
    likes: 10,
  },
];

export const recentPosts: Post[] = allPosts.filter((post) => post.id === '4' || post.id === '5');
export const taggedPosts: Post[] = allPosts.filter((post) => post.id === '6');

export const getPostById = (postId: string) => allPosts.find((post) => post.id === postId);
