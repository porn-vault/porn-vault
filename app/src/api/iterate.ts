const ITERATE_TAKE = 24;

export interface PaginationQuery {
  take: number;
  page: number;
}

export type ProgressCallback = (progressCb: {
  iteratedCount: number;
  total: number;
  percent: number;
}) => void;

export async function iterate<T extends { _id: string } = { _id: string }>(
  fetchPage: (paginationQuery: PaginationQuery) => Promise<{ items: T[]; numItems: number }>,
  itemCb: (item: T) => void | unknown | Promise<void> | Promise<unknown>,
  progressCb?: ProgressCallback
): Promise<T | void> {
  let more = true;
  let iteratedCount = 0;

  for (let page = 0; more; page++) {
    const { items, numItems } = await fetchPage({
      take: ITERATE_TAKE,
      page,
    });

    if (items.length) {
      if (!iteratedCount && progressCb) {
        // Invoke the progress callback before the iteration so it can initialize
        // with the total count
        progressCb({ iteratedCount, total: numItems, percent: (iteratedCount / numItems) * 100 });
      }

      for (const item of items) {
        const res = await itemCb(item);
        iteratedCount++;
        if (progressCb) {
          progressCb({ iteratedCount, total: numItems, percent: (iteratedCount / numItems) * 100 });
        }
        if (res) {
          return item;
        }
      }
    } else {
      more = false;
    }
  }
}
