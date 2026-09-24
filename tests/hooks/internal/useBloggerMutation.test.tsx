import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useBloggerMutation } from "../../../src/hooks/internal/useBloggerMutation"

describe("useBloggerMutation", () => {
  test("starts idle", () => {
    const { result } = renderHook(() =>
      useBloggerMutation({ mutationFn: (n: number) => Promise.resolve(n * 2) }),
    )
    expect(result.current.status).toBe("idle")
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  test("mutateAsync resolves with the result, sets success status, and calls onSuccess", async () => {
    const seen: Array<{ data: number; args: number }> = []
    const { result } = renderHook(() =>
      useBloggerMutation({
        mutationFn: (n: number) => Promise.resolve(n * 2),
        onSuccess: (data, args) => seen.push({ data, args }),
      }),
    )
    let value: number | undefined
    await act(async () => {
      value = await result.current.mutateAsync(5)
    })
    expect(value).toBe(10)
    expect(result.current.status).toBe("success")
    expect(result.current.data).toBe(10)
    expect(seen).toEqual([{ data: 10, args: 5 }])
  })

  test("mutateAsync rejects with an Error, sets error status, and calls onError", async () => {
    const seen: Array<{ message: string; args: number }> = []
    const { result } = renderHook(() =>
      useBloggerMutation({
        mutationFn: (_n: number) => Promise.reject(new Error("nope")),
        onError: (error, args) => seen.push({ message: error.message, args }),
      }),
    )
    await act(async () => {
      await expect(result.current.mutateAsync(1)).rejects.toThrow("nope")
    })
    expect(result.current.status).toBe("error")
    expect(result.current.error?.message).toBe("nope")
    expect(seen).toEqual([{ message: "nope", args: 1 }])
  })

  test("mutate() fires the mutation without throwing and updates state reactively", async () => {
    const { result } = renderHook(() =>
      useBloggerMutation({ mutationFn: (n: number) => Promise.resolve(n + 1) }),
    )
    act(() => {
      result.current.mutate(41)
    })
    await waitFor(() => expect(result.current.status).toBe("success"))
    expect(result.current.data).toBe(42)
  })

  test("mutate() on a rejecting mutationFn does not throw and surfaces the error via state", async () => {
    const { result } = renderHook(() =>
      useBloggerMutation({ mutationFn: () => Promise.reject(new Error("fire-and-forget-fail")) }),
    )
    expect(() => {
      act(() => {
        result.current.mutate(0)
      })
    }).not.toThrow()
    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error?.message).toBe("fire-and-forget-fail")
  })

  test("reset() returns the mutation to idle", async () => {
    const { result } = renderHook(() =>
      useBloggerMutation({ mutationFn: () => Promise.resolve(1) }),
    )
    await act(async () => {
      await result.current.mutateAsync(0)
    })
    expect(result.current.status).toBe("success")
    act(() => {
      result.current.reset()
    })
    expect(result.current.status).toBe("idle")
    expect(result.current.data).toBeUndefined()
  })
})
