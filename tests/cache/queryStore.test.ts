import { describe, expect, test } from "bun:test"
import { QueryStore } from "../../src/cache/queryStore"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("QueryStore", () => {
  test("getSnapshot returns the same stable idle reference for an unknown key across calls", () => {
    const store = new QueryStore()
    const first = store.getSnapshot("unknown")
    const second = store.getSnapshot("unknown")
    expect(first).toBe(second)
    expect(first.data).toBeUndefined()
    expect(first.isFetching).toBe(false)
  })

  test("fetchOnce marks isFetching true immediately, then resolves with data and notifies subscribers", async () => {
    const store = new QueryStore()
    const notifications: number[] = []
    store.subscribe("k1", () => notifications.push(store.getSnapshot("k1").isFetching ? 1 : 0))

    const { promise, resolve } = deferred<string>()
    const call = store.fetchOnce("k1", () => promise)
    expect(store.getSnapshot("k1").isFetching).toBe(true)

    resolve("hello")
    await call

    const snapshot = store.getSnapshot("k1")
    expect(snapshot.isFetching).toBe(false)
    expect(snapshot.data).toBe("hello")
    expect(snapshot.error).toBeUndefined()
    expect(notifications.length).toBeGreaterThanOrEqual(2)
  })

  test("fetchOnce dedupes concurrent calls for the same key into a single fetcher invocation", async () => {
    const store = new QueryStore()
    let calls = 0
    const fetcher = () => {
      calls += 1
      return Promise.resolve("v")
    }
    const [a, b] = await Promise.all([
      store.fetchOnce("k2", fetcher),
      store.fetchOnce("k2", fetcher),
    ])
    expect(calls).toBe(1)
    expect(a).toBe("v")
    expect(b).toBe("v")
  })

  test("fetchOnce records an Error on rejection while preserving any prior data", async () => {
    const store = new QueryStore()
    await store.fetchOnce("k3", () => Promise.resolve("cached"))
    await expect(store.fetchOnce("k3", () => Promise.reject(new Error("boom")))).rejects.toThrow(
      "boom",
    )
    const snapshot = store.getSnapshot("k3")
    expect(snapshot.error?.message).toBe("boom")
    expect(snapshot.data).toBe("cached")
    expect(snapshot.isFetching).toBe(false)
  })

  test("invalidate clears data and bumps epoch only for keys matching the predicate", async () => {
    const store = new QueryStore()
    await store.fetchOnce("posts:1", () => Promise.resolve("a"))
    await store.fetchOnce("pages:1", () => Promise.resolve("b"))
    const epochBefore = store.getSnapshot("posts:1").epoch

    let notified = false
    store.subscribe("posts:1", () => {
      notified = true
    })
    store.invalidate((key) => key.startsWith("posts:"))

    const postsSnapshot = store.getSnapshot("posts:1")
    expect(postsSnapshot.data).toBeUndefined()
    expect(postsSnapshot.epoch).toBeGreaterThan(epochBefore)
    expect(notified).toBe(true)
    expect(store.getSnapshot("pages:1").data).toBe("b")
  })

  test("a stale in-flight fetch started before invalidate does not overwrite the invalidated entry, and clears isFetching instead of getting stuck", async () => {
    const store = new QueryStore()
    const { promise, resolve } = deferred<string>()
    const stale = store.fetchOnce("k4", () => promise)
    expect(store.getSnapshot("k4").isFetching).toBe(true)

    store.invalidate((key) => key === "k4")
    resolve("stale-value")
    await stale

    const snapshot = store.getSnapshot("k4")
    expect(snapshot.data).toBeUndefined()
    expect(snapshot.isFetching).toBe(false)
  })

  test("invalidate during an in-flight fetch frees the key so the next fetchOnce starts a new request", async () => {
    const store = new QueryStore()
    const first = deferred<string>()
    const second = deferred<string>()
    let calls = 0
    const fetcher = () => {
      calls += 1
      return calls === 1 ? first.promise : second.promise
    }

    const initial = store.fetchOnce("k5", fetcher)
    store.invalidate((key) => key === "k5")

    // The invalidated key must NOT hand back the doomed promise.
    const refetched = store.fetchOnce("k5", fetcher)
    expect(calls).toBe(2)
    expect(refetched).not.toBe(initial)

    first.resolve("stale")
    await initial
    second.resolve("fresh")
    await refetched
    expect(store.getSnapshot("k5").data).toBe("fresh")
  })

  test("cancel aborts the in-flight request and drops it so a later fetchOnce starts over", async () => {
    const store = new QueryStore()
    let signal: AbortSignal | undefined
    void store.fetchOnce("k6", (s) => {
      signal = s
      return new Promise<string>(() => {})
    })
    expect(signal?.aborted).toBe(false)

    store.cancel("k6")
    expect(signal?.aborted).toBe(true)

    let calls = 0
    await store.fetchOnce("k6", () => {
      calls += 1
      return Promise.resolve("after-cancel")
    })
    expect(calls).toBe(1)
    expect(store.getSnapshot("k6").data).toBe("after-cancel")
  })

  test("unsubscribing the last listener prunes the key's listener set", async () => {
    const store = new QueryStore()
    let notifications = 0
    const unsubscribe = store.subscribe("k7", () => {
      notifications += 1
    })

    await store.fetchOnce("k7", () => Promise.resolve("a"))
    expect(notifications).toBeGreaterThan(0)

    const afterUnsubscribe = notifications
    unsubscribe()
    await store.fetchOnce("k7", () => Promise.resolve("b"))

    // The pruned listener must never fire again.
    expect(notifications).toBe(afterUnsubscribe)

    // And re-subscribing the same key still works after the prune.
    let resubscribed = 0
    store.subscribe("k7", () => {
      resubscribed += 1
    })
    store.invalidate((key) => key === "k7")
    expect(resubscribed).toBe(1)
  })
})
