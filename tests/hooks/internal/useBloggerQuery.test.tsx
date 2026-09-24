import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryStore } from "../../../src/cache/queryStore"
import { useBloggerQuery } from "../../../src/hooks/internal/useBloggerQuery"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe("useBloggerQuery", () => {
  test("starts loading, then resolves with data from the fetcher", async () => {
    const store = new QueryStore()
    const { result } = renderHook(() =>
      useBloggerQuery({ store, key: "k1", fetcher: () => Promise.resolve("hello") }),
    )
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe("hello"))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isValidating).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  test("does not fetch when key is null", async () => {
    const store = new QueryStore()
    let calls = 0
    const { result } = renderHook(() =>
      useBloggerQuery({
        store,
        key: null,
        fetcher: () => {
          calls += 1
          return Promise.resolve("x")
        },
      }),
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    await act(async () => {})
    expect(calls).toBe(0)
  })

  test("does not fetch when enabled is false", async () => {
    const store = new QueryStore()
    let calls = 0
    renderHook(() =>
      useBloggerQuery({
        store,
        key: "k-disabled",
        enabled: false,
        fetcher: () => {
          calls += 1
          return Promise.resolve("x")
        },
      }),
    )
    await act(async () => {})
    expect(calls).toBe(0)
  })

  test("surfaces a rejected fetcher as error and clears isLoading", async () => {
    const store = new QueryStore()
    const { result } = renderHook(() =>
      useBloggerQuery({ store, key: "k2", fetcher: () => Promise.reject(new Error("boom")) }),
    )
    await waitFor(() => expect(result.current.error?.message).toBe("boom"))
    expect(result.current.isLoading).toBe(false)
  })

  test("refetch() re-invokes the fetcher and updates data", async () => {
    const store = new QueryStore()
    let call = 0
    const { result } = renderHook(() =>
      useBloggerQuery({
        store,
        key: "k3",
        fetcher: () => Promise.resolve(`v${++call}`),
      }),
    )
    await waitFor(() => expect(result.current.data).toBe("v1"))
    await act(async () => {
      store.invalidate((key) => key === "k3")
      await result.current.refetch()
    })
    await waitFor(() => expect(result.current.data).toBe("v2"))
  })

  test("two concurrent hook instances with the same key share exactly one fetcher call", async () => {
    const store = new QueryStore()
    let calls = 0
    const { promise, resolve } = deferred<string>()
    const fetcher = () => {
      calls += 1
      return promise
    }
    const a = renderHook(() => useBloggerQuery({ store, key: "shared", fetcher }))
    const b = renderHook(() => useBloggerQuery({ store, key: "shared", fetcher }))

    expect(a.result.current.isValidating).toBe(true)
    expect(b.result.current.isValidating).toBe(true)

    resolve("shared-data")
    await waitFor(() => expect(a.result.current.data).toBe("shared-data"))
    await waitFor(() => expect(b.result.current.data).toBe("shared-data"))
    expect(calls).toBe(1)
  })

  test("invalidating a key while its fetch is in flight refetches instead of getting stuck", async () => {
    const store = new QueryStore()
    const first = deferred<string>()
    const second = deferred<string>()
    let calls = 0
    const fetcher = () => {
      calls += 1
      return calls === 1 ? first.promise : second.promise
    }

    const { result } = renderHook(() => useBloggerQuery({ store, key: "race", fetcher }))
    expect(calls).toBe(1)

    await act(async () => {
      store.invalidate((key) => key === "race")
    })

    // The stale first request settles AFTER the invalidation and must not
    // leave the query stranded with no data and no follow-up fetch.
    await act(async () => {
      first.resolve("stale")
      await first.promise
    })

    expect(calls).toBe(2)

    await act(async () => {
      second.resolve("fresh")
      await second.promise
    })

    await waitFor(() => expect(result.current.data).toBe("fresh"))
    expect(result.current.isLoading).toBe(false)
  })

  test("unmounting aborts the in-flight request", async () => {
    const store = new QueryStore()
    let signal: AbortSignal | undefined
    const { unmount } = renderHook(() =>
      useBloggerQuery({
        store,
        key: "abort-me",
        fetcher: (s) => {
          signal = s
          return new Promise(() => {})
        },
      }),
    )
    expect(signal?.aborted).toBe(false)
    unmount()
    expect(signal?.aborted).toBe(true)
  })

  test("a refetch does not get aborted by its own effect re-run", async () => {
    const store = new QueryStore()
    let calls = 0
    const { result } = renderHook(() =>
      useBloggerQuery({
        store,
        key: "no-self-abort",
        fetcher: () => Promise.resolve(`v${++calls}`),
      }),
    )
    await waitFor(() => expect(result.current.data).toBe("v1"))
    await act(async () => {
      store.invalidate((key) => key === "no-self-abort")
      await result.current.refetch()
    })
    // Exactly one refetch - the effect re-run must not abort the request it
    // just started and trigger a third call.
    expect(calls).toBe(2)
  })
})
