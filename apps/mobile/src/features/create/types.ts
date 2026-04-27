export type CreateMode = 'post' | 'event';

export type CreateParams = {
  mode?: string | string[];
  mediaUri?: string | string[];
  mediaType?: string | string[];
  /** JSON-stringified `CreateMediaItem[]` for post editing flows. */
  postMedia?: string | string[];
};

export type CreateMediaItem = {
  uri: string;
  type: string | undefined;
};

export type PostModeValues = {
  description: string;
  tags: string[];
  /** Posts can have multiple photos/videos. */
  media: CreateMediaItem[];
  eventId?: string;
};

export type EventModeValues = {
  name: string;
  description: string;
  tags: string[];
  /** Events always have a single cover photo. */
  media: CreateMediaItem;
  startDate: number;
  endDate: number;
};

export type CreateFormValues = {
  post: PostModeValues;
  event: EventModeValues;
};
