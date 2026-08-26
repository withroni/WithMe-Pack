export type Item = { id: string; label: string; done: boolean };

export type List = {
  id: string;
  name: string;
  created: string;
  items: Item[];
};

/** A finished list, frozen at the moment it was archived. */
export type Snapshot = {
  name: string;
  created: string;
  /** total item count */
  n: number;
  /** how many were checked */
  p: number;
  items: { label: string; done: boolean }[];
};

export type PackKey = 'minimal' | 'basic' | 'maximal';

export type Pack = {
  n: string;
  c: string;
  d: string;
  color: string;
  items: string[];
};
