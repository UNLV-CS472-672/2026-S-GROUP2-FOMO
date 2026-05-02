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
  // ----------------------- profiles -----------------------
  users: defineTable({
    bio: v.string(), // clerk doesn't handle this
    // clerk handles below this
    clerkId: v.string(), // For Clerk integration
    username: v.string(), // should be unique and this is the main display/handle on frontend
    avatarUrl: v.string(), // should get from clerk
    deletedAt: v.optional(v.number()),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_username', ['username']),

  friends: defineTable({
    requesterId: v.id('users'),
    recipientId: v.id('users'),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('rejected')),
  })
    .index('by_requesterId', ['requesterId'])
    .index('by_recipientId', ['recipientId'])
    .index('by_recipientId_requesterId', ['recipientId', 'requesterId']),
  // --------------------------------------------------------

  // ------------------------ events ------------------------
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

  attendance: defineTable({
    userId: v.id('users'),
    eventId: v.union(v.id('events'), v.id('externalEvents')),
    status: v.optional(
      v.union(v.literal('going'), v.literal('interested'), v.literal('uninterested'))
    ),
    notification: v.optional(v.union(v.literal('all'), v.literal('friends'), v.literal('none'))),
    updatedAt: v.number(),
    previousStatus: v.optional(
      v.union(v.literal('going'), v.literal('interested'), v.literal('uninterested'))
    ),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_updatedAt', ['userId', 'updatedAt'])
    .index('by_event', ['eventId'])
    .index('by_user_event', ['userId', 'eventId']),

  eventTags: defineTable({
    eventId: v.id('events'),
    tagId: v.id('tags'),
  })
    .index('by_event', ['eventId'])
    .index('by_tag', ['tagId'])
    .index('by_event_tag', ['eventId', 'tagId']),
  // --------------------------------------------------------

  // ------------------------- posts -------------------------
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

  postTags: defineTable({
    postId: v.id('posts'),
    tagId: v.id('tags'),
  })
    .index('by_post', ['postId'])
    .index('by_tag', ['tagId'])
    .index('by_post_tag', ['postId', 'tagId']),

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
  // --------------------------------------------------------

  // ---------------- tags & recommendations ----------------
  tags: defineTable({
    name: v.string(),
  }).index('by_name', ['name']),

  userTagPreferences: defineTable({
    userId: v.id('users'),
    tags: v.array(v.id('tags')),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  userTagWeights: defineTable({
    userId: v.id('users'),
    weights: v.array(v.number()),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

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

  eventRecs: defineTable({
    userId: v.id('users'),
    eventIds: v.array(v.id('events')),
  }).index('by_userId', ['userId']),
  // --------------------------------------------------------

  // ---------------------- moderation ----------------------

  blockedUsers: defineTable({
    blockerId: v.id('users'),
    blockedUserId: v.id('users'),
  })
    .index('by_blockerId', ['blockerId'])
    .index('by_blockedUserId', ['blockedUserId'])
    .index('by_blockerId_blockedUserId', ['blockerId', 'blockedUserId']),

  moderationReports: defineTable({
    reporterId: v.id('users'),
    targetType: v.union(
      v.literal('user'),
      v.literal('post'),
      v.literal('comment'),
      v.literal('event')
    ),
    targetUserId: v.optional(v.id('users')),
    targetPostId: v.optional(v.id('posts')),
    targetCommentId: v.optional(v.id('comments')),
    targetEventId: v.optional(v.id('events')),
    reason: v.string(),
    details: v.optional(v.string()),
    source: v.union(v.literal('report'), v.literal('block')),
    status: v.union(v.literal('open'), v.literal('reviewed'), v.literal('resolved')),
  })
    .index('by_reporterId', ['reporterId'])
    .index('by_targetUserId', ['targetUserId'])
    .index('by_targetPostId', ['targetPostId'])
    .index('by_targetCommentId', ['targetCommentId'])
    .index('by_targetEventId', ['targetEventId']),

  hiddenPosts: defineTable({
    viewerId: v.id('users'),
    postId: v.id('posts'),
    hiddenReason: v.union(v.literal('reported')),
  })
    .index('by_viewerId', ['viewerId'])
    .index('by_postId', ['postId'])
    .index('by_viewerId_postId', ['viewerId', 'postId']),

  support: defineTable({
    email: v.string(),
    description: v.string(),
  }),
  // --------------------------------------------------------
});
