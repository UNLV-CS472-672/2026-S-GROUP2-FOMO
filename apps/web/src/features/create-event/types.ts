export type SelectedEventLocation = {
  kind: 'current' | 'place';
  label: string;
  address?: string;
  latitude: number;
  longitude: number;
};

export type EventTagOption = {
  id: string;
  name: string;
};
