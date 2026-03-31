export const dateTimeColumnType =
  process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID
    ? ('datetime' as const)
    : ('timestamptz' as const);

