// Flat page returned by the Manager's server-side list endpoints (/…/search).
export interface ListPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Common query shape: filters + q + from/to (yyyy-MM-dd) + page/size/sort.
export interface ListQuery {
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export function emptyPage<T>(): ListPage<T> {
  return { content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 };
}
