import { vi } from 'vitest'

export type QueryResult<T = unknown> = { data: T; error: unknown }

// A stand-in for the Supabase query builder returned by `.from(...)`. Every
// filter/modifier method (`.select()`, `.eq()`, `.order()`, ...) is a spy
// that returns the same builder so calls chain exactly like the real thing,
// and the builder itself is "thenable" so `await`-ing it (with or without a
// terminal `.single()`/`.maybeSingle()`) resolves to the configured result —
// mirroring how supabase-js's PostgrestFilterBuilder works.
export function createQueryBuilder<T = unknown>(result: QueryResult<T>) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (
      onfulfilled?: ((value: QueryResult<T>) => unknown) | null,
      onrejected?: ((reason: unknown) => unknown) | null
    ) => Promise.resolve(result).then(onfulfilled, onrejected),
  }
  return builder
}

// A minimal fake `SupabaseClient`: `.from(table)` and `.rpc(fn)` are spies
// you configure per-test with `mockReturnValueOnce`/`mockImplementation` to
// hand back a `createQueryBuilder(...)` (or, for `.rpc`, a resolved
// `{ data, error }` promise) for the calls the code under test makes.
export function createSupabaseMock() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }
}
