import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import type { QueryEntry, QueryStore } from "../../cache/queryStore"

export interface BloggerQuerySpec<T> {
  readonly store: QueryStore
  readonly key: string | null
  readonly fetcher: (signal: AbortSignal) => Promise<T>
  readonly enabled?: boolean | undefined
}

export interface UseBloggerQueryResult<T> {
  readonly data: T | undefined
  readonly error: Error | undefined
  readonly isLoading: boolean
  readonly isValidating: boolean
  readonly refetch: () => Promise<T | undefined>
}

const DISABLED_ENTRY: QueryEntry<never> = {
  data: undefined,
  error: undefined,
  isFetching: false,
  updatedAt: 0,
  epoch: 0,
}

/**
 * Generic cache-backed query hook every public `useXxx` read hook is built
 * on. Takes an explicit `store` (rather than reading `useBlogger()` itself)
 * so it stays a pure, provider-free unit to test, and callers construct the
 * `BloggerQuerySpec` from their own `useBlogger()` call.
 *
 * `fetcher` is read through a ref instead of the effect's dependency array:
 * specific hooks recreate their fetcher closure every render (it captures
 * the current params), so depending on it directly would refetch on every
 * render regardless of whether `key` actually changed.
 */
export function useBloggerQuery<T>(spec: BloggerQuerySpec<T>): UseBloggerQueryResult<T> {
  const { store, key, fetcher, enabled = true } = spec
  const activeKey = enabled ? key : null

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (activeKey === null) return () => {}
      return store.subscribe(activeKey, onStoreChange)
    },
    [store, activeKey],
  )
  const getSnapshot = useCallback((): QueryEntry<T> => {
    return activeKey === null ? DISABLED_ENTRY : store.getSnapshot<T>(activeKey)
  }, [store, activeKey])

  const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const refetch = useCallback((): Promise<T | undefined> => {
    if (activeKey === null) return Promise.resolve(undefined)
    return store.fetchOnce(activeKey, (signal) => fetcherRef.current(signal))
  }, [store, activeKey])

  // biome-ignore lint/correctness/useExhaustiveDependencies: entry.epoch (not listed) drives refetch-on-invalidate; adding it back is the actual fix biome suggests in reverse - epoch must stay OUT since it's derived from the same store the effect writes to
  useEffect(() => {
    if (activeKey === null) return
    store
      .fetchOnce(activeKey, (signal) => fetcherRef.current(signal))
      .catch(() => {
        // surfaced through the entry's `.error`; this effect fires the request
        // and does not itself await the outcome, so swallow to avoid an
        // unhandled-rejection warning.
      })
  }, [store, activeKey, entry.epoch])

  // Abort only when this hook stops owning the key - on unmount or when the
  // key changes. This is deliberately a separate effect from the fetch above:
  // that one re-runs on every epoch bump (i.e. every invalidation/refetch), and
  // aborting there would cancel the very request the refetch just started.
  useEffect(() => {
    if (activeKey === null) return
    return () => store.cancel(activeKey)
  }, [store, activeKey])

  return {
    data: entry.data,
    error: entry.error,
    isLoading: entry.isFetching && entry.data === undefined,
    isValidating: entry.isFetching,
    refetch,
  }
}
