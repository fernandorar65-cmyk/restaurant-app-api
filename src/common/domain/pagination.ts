export interface PageRequest {
  /** 1-based page number. */
  page: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function mapPage<T, R>(page: Page<T>, map: (item: T) => R): Page<R> {
  return { ...page, items: page.items.map(map) };
}
