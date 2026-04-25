export type CreateMode = 'post' | 'event';

export type CreateParams = {
  mode?: string | string[];
  mediaUri?: string | string[];
  mediaType?: string | string[];
};

export type CreateMedia = {
  uri: string;
  type: string | undefined;
};

export type CreateModeValues = {
  description: string;
  tags: string[];
  media: CreateMedia;
};

export type PostModeValues = CreateModeValues & {
  eventId?: string;
};

export type EventModeValues = CreateModeValues & {
  name: string;
};

export type CreateFormValues = {
  post: PostModeValues;
  event: EventModeValues;
};
