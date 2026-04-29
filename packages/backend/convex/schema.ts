import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const sharedEventFields = {
  name: v.string(),
  caption: v.string(),
  startDate: v.number(), // ms since epoch
  endDate: v.number(), // ms since epoch
  location: v.object({
    latitude: v.number(),
    longitude: v.number(),
    h3Index: v.string(),
  }),
};

export default defineSchema({
  users: defineTable({
    bio: v.string(), // clerk doesn't handle this
    // clerk handles below this
    clerkId: v.string(), // For Clerk integration
    username: v.string(), // should be unique and this is the main display/handle on frontend
    displayName: v.string(), // display names that can be changed often/whenever? --- not sure if this will be a clerk value tbh
    avatarUrl: v.string(), // should get from clerk
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_username', ['username']),

  events: defineTable({
    ...sharedEventFields,
    mediaId: v.optional(v.id('_storage')),
    hostIds: v.array(v.id('users')),
  })
    .index('by_startDate', ['startDate'])
    .index('by_endDate', ['endDate'])
    .index('by_startDate_endDate', ['startDate', 'endDate'])
    .index('by_h3Index', ['location.h3Index'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['location.h3Index'],
    }),

  externalEvents: defineTable({
    ...sharedEventFields,
    externalKey: v.string(),
    organization: v.string(),
  })
    .index('by_externalKey', ['externalKey'])
    .index('by_startDate', ['startDate'])
    .index('by_endDate', ['endDate'])
    .index('by_startDate_endDate', ['startDate', 'endDate']),

  posts: defineTable({
    eventId: v.optional(v.id('events')),
    caption: v.optional(v.string()), // necessary if no mediaIds
    mediaIds: v.array(v.id('_storage')), // necessary if no caption
    authorId: v.id('users'),
    likeCount: v.optional(v.number()),
  })
    .index('by_author', ['authorId'])
    .index('by_event', ['eventId']),

  comments: defineTable({
    postId: v.id('posts'),
    authorId: v.id('users'),
    text: v.string(),
    likeCount: v.optional(v.number()),
    parentId: v.optional(v.id('comments')),
  })
    .index('by_post', ['postId'])
    .index('by_author', ['authorId'])
    .index('by_post_author', ['postId', 'authorId'])
    .index('by_parent', ['parentId']),

  tags: defineTable({
    name: v.string(),
  }).index('by_name', ['name']),

  //
  // These join tables can be used to define many-to-many relationships like:
  // - User "x" is going to event "a", "b", and "c"
  // - Post "x" has tags "a", "b", and "c"
  // - etc ...
  //

  attendance: defineTable({
    userId: v.id('users'),
    eventId: v.union(v.id('events'), v.id('externalEvents')),
    status: v.optional(
      v.union(v.literal('going'), v.literal('interested'), v.literal('uninterested'))
    ),
    notification: v.optional(v.union(v.literal('all'), v.literal('friends'), v.literal('none'))),
  })
    .index('by_userId', ['userId'])
    .index('by_event', ['eventId'])
    .index('by_user_event', ['userId', 'eventId']),

  eventTags: defineTable({
    eventId: v.id('events'),
    tagId: v.id('tags'),
  })
    .index('by_event', ['eventId'])
    .index('by_tag', ['tagId'])
    .index('by_event_tag', ['eventId', 'tagId']),

  postTags: defineTable({
    postId: v.id('posts'),
    tagId: v.id('tags'),
  })
    .index('by_post', ['postId'])
    .index('by_tag', ['tagId'])
    .index('by_post_tag', ['postId', 'tagId']),

  friendRecs: defineTable({
    userId: v.id('users'),
    recs: v.array(
      v.object({
        userId: v.id('users'),
        score: v.number(),
      })
    ),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  friends: defineTable({
    requesterId: v.id('users'),
    recipientId: v.id('users'),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('rejected')),
  })
    .index('by_requesterId', ['requesterId'])
    .index('by_recipientId', ['recipientId'])
    .index('by_recipientId_requesterId', ['recipientId', 'requesterId']),

  userTagWeights: defineTable({
    userId: v.id('users'),
    weights: v.array(v.number()),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  userTagPreferences: defineTable({
    userId: v.id('users'),
    tags: v.array(v.id('tags')),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  likes: defineTable({
    userId: v.id('users'),
    commentId: v.optional(v.id('comments')), // optional -- only if liking a comment
    postId: v.optional(v.id('posts')), // optional -- only if liking a post
  })
    .index('by_userId', ['userId'])
    .index('by_postId', ['postId'])
    .index('by_commentId', ['commentId'])
    .index('by_userId_postId', ['userId', 'postId'])
    .index('by_userId_commentId', ['userId', 'commentId']),

  eventRecs: defineTable({
    userId: v.id('users'),
    eventIds: v.array(v.id('events')),
  }).index('by_userId', ['userId']),
});
