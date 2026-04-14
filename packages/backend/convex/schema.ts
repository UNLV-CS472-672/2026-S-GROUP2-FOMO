import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    clerkId: v.string(), // Clerk user id (`clerkId` JWT claim; Convex may still expose legacy `tokenIdentifier`)
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_name', ['name']),

  events: defineTable({
    name: v.string(),
    organization: v.string(),
    description: v.string(),
    startDate: v.number(), // ms since epoch
    endDate: v.number(), // ms since epoch
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      h3Index: v.string(),
    }),
  })
    .index('by_startDate', ['startDate'])
    .index('by_endDate', ['endDate'])
    .index('by_startDate_endDate', ['startDate', 'endDate']),

  posts: defineTable({
    title: v.string(),
    description: v.string(),
    authorId: v.id('users'),
    likeCount: v.optional(v.number()),
  }).index('by_author', ['authorId']),

  comments: defineTable({
    postId: v.id('posts'),
    authorId: v.id('users'),
    text: v.string(),
    likeCount: v.optional(v.number()),
  })
    .index('by_post', ['postId'])
    .index('by_author', ['authorId'])
    .index('by_post_author', ['postId', 'authorId']),

  tags: defineTable({
    name: v.string(),
  }).index('by_name', ['name']),

  //
  // These join tables can be used to define many-to-many relationships like:
  // - User "x" is going to event "a", "b", and "c"
  // - Post "x" has tags "a", "b", and "c"
  // - etc ...
  //

  usersToEvents: defineTable({
    userId: v.id('users'),
    eventId: v.id('events'),
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

  userPreferredTags: defineTable({
    userId: v.id('users'),
    tagIds: v.array(v.id('tags')),
  }).index('by_userId', ['userId']),

  userPostLike: defineTable({
    userId: v.id('users'),
    postId: v.id('posts'),
  })
    .index('by_userId', ['userId'])
    .index('by_postId', ['postId'])
    .index('by_userId_postId', ['userId', 'postId']),

  userCommentLike: defineTable({
    userId: v.id('users'),
    commentId: v.id('comments'),
  })
    .index('by_userId', ['userId'])
    .index('by_commentId', ['commentId'])
    .index('by_userId_commentId', ['userId', 'commentId']),
});
