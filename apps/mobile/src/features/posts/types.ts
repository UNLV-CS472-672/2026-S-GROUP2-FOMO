import { api } from '@fomo/backend/convex/_generated/api';
import { FunctionReturnType } from 'convex/server';

type ProfileFeed = NonNullable<FunctionReturnType<typeof api.users.getProfileFeed>>;

export type FeedPost = ProfileFeed[number];
export type FeedComment = FeedPost['comments'][number];
