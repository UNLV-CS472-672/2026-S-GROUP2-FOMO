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
});
