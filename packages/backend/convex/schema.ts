import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(), // For Clerk integration
  }).index('by_token', ['tokenIdentifier']),

  events: defineTable({
    name: v.string(),
    organization: v.string(),
    description: v.string(),
    startDate: v.number(), // ms since epoch
    endDate: v.number(), // ms since epoch
  })
    .index('by_startDate', ['startDate'])
    .index('by_endDate', ['endDate'])
    .index('by_startDate_endDate', ['startDate', 'endDate']),

  posts: defineTable({
    title: v.string(),
    description: v.string(),
    authorId: v.id('users'),
  }).index('by_author', ['authorId']),

  comments: defineTable({
    postId: v.id('posts'),
    authorId: v.id('users'),
    text: v.string(),
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
    .index('by_user', ['userId'])
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

  fake_user_attendance_100: defineTable({
    event0: v.float64(),
    event1: v.float64(),
    event2: v.float64(),
    event3: v.float64(),
    event4: v.float64(),
    event5: v.float64(),
    event6: v.float64(),
    event7: v.float64(),
    event8: v.float64(),
    event9: v.float64(),
    user: v.string(),
  }),

  fake_user_event_tags_vibe_100: defineTable({
    bright: v.float64(),
    casual: v.float64(),
    celebratory: v.float64(),
    chill: v.float64(),
    cozy: v.float64(),
    dark: v.float64(),
    educational: v.float64(),
    elegant: v.float64(),
    experimental: v.float64(),
    formal: v.float64(),
    futuristic: v.float64(),
    high_energy: v.float64(),
    hype: v.float64(),
    immersive: v.float64(),
    inspirational: v.float64(),
    interactive: v.float64(),
    intimate: v.float64(),
    laid_back: v.float64(),
    loud: v.float64(),
    mainstream: v.float64(),
    nostalgic: v.float64(),
    playful: v.float64(),
    retro: v.float64(),
    romantic: v.float64(),
    serious: v.float64(),
    spectacle: v.float64(),
    underground: v.float64(),
    user: v.string(),
  }),
});
