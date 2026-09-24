export interface QueryEntry<T = unknown> {
  readonly data: T | undefined
  readonly error: Error | undefined
  readonly isFetching: boolean
  readonly updatedAt: number
  readonly epoch: number
}

type Listener = () => void

const IDLE_ENTRY: QueryEntry<never> = {
  data: undefined,
  error: undefined,
  isFetching: false,
  updatedAt: 0,
  epoch: 0,
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason))
}

/**
 * A minimal external store for cached, de-duplicated, invalidatable async
 * reads - the shared primitive `useBloggerQuery`/`useBloggerMutation` sit on
 * top of via `useSyncExternalStore`. `epoch` exists so a hook's effect can
 * tell "invalidated, please refetch" apart from "still the same result":
 * `invalidate()` bumps it and a stale in-flight fetch started before the
 * bump is discarded on settle instead of overwriting the fresher state.
 */
export class QueryStore {
  private readonly entries = new Map<string, QueryEntry>()
  private readonly listeners = new Map<string, Set<Listener>>()
  private readonly inFlight = new Map<string, Promise<unknown>>()
  private readonly controllers = new Map<string, AbortController>()

  getSnapshot<T>(key: string): QueryEntry<T> {
    return (this.entries.get(key) as QueryEntry<T> | undefined) ?? IDLE_ENTRY
  }

  subscribe(key: string, listener: Listener): () => void {
    let set = this.listeners.get(key)
    if (!set) {
      set = new Set()
      this.listeners.set(key, set)
    }
    set.add(listener)
    return () => {
      // Prune the Set once its last listener unsubscribes; otherwise every
      // key ever mounted leaves an empty Set behind for the store's lifetime.
      set?.delete(listener)
      if (set && set.size === 0) this.listeners.delete(key)
    }
  }

  /**
   * Aborts the in-flight request for `key`, if any, and drops it from the
   * in-flight table so a later `fetchOnce` starts fresh. Called when the
   * consumer that started the request unmounts or points at a new key.
   */
  cancel(key: string): void {
    const controller = this.controllers.get(key)
    this.inFlight.delete(key)
    this.controllers.delete(key)
    controller?.abort()
  }

  fetchOnce<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key)
    if (existing) return existing as Promise<T>

    const startEpoch = this.getSnapshot(key).epoch
    this.setEntry(key, { ...this.getSnapshot<T>(key), isFetching: true })

    const controller = new AbortController()
    this.controllers.set(key, controller)
    const promise = fetcher(controller.signal).then(
      (data) => {
        this.inFlight.delete(key)
        this.controllers.delete(key)
        if (this.getSnapshot(key).epoch !== startEpoch) {
          this.setEntry(key, { ...this.getSnapshot<T>(key), isFetching: false })
          return data
        }
        this.setEntry(key, {
          data,
          error: undefined,
          isFetching: false,
          updatedAt: Date.now(),
          epoch: startEpoch,
        })
        return data
      },
      (reason: unknown) => {
        this.inFlight.delete(key)
        this.controllers.delete(key)
        const error = toError(reason)
        if (this.getSnapshot(key).epoch !== startEpoch) {
          this.setEntry(key, { ...this.getSnapshot<T>(key), isFetching: false })
          throw error
        }
        this.setEntry(key, {
          data: this.getSnapshot<T>(key).data,
          error,
          isFetching: false,
          updatedAt: Date.now(),
          epoch: startEpoch,
        })
        throw error
      },
    )

    this.inFlight.set(key, promise)
    return promise
  }

  invalidate(predicate: (key: string) => boolean): void {
    for (const [key, entry] of this.entries) {
      if (!predicate(key)) continue
      // Drop any in-flight request for this key: its result is now stale (the
      // epoch bump below discards it), and leaving it in `inFlight` would make
      // the follow-up fetchOnce return that same doomed promise instead of
      // starting a fresh request - stranding the key with no data and no fetch.
      this.inFlight.delete(key)
      this.controllers.delete(key)
      this.setEntry(key, {
        data: undefined,
        error: undefined,
        isFetching: entry.isFetching,
        updatedAt: entry.updatedAt,
        epoch: entry.epoch + 1,
      })
    }
  }

  private setEntry<T>(key: string, entry: QueryEntry<T>): void {
    this.entries.set(key, entry)
    for (const listener of this.listeners.get(key) ?? []) listener()
  }
}
