import { describe, expect, test } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { act } from "react"
import { usePosts } from "../../../src/hooks/posts/usePosts"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePosts", () => {
  test("resolves the first page of posts for the provider's defaultBlogId", async () => {
    const wrapper = providerWrapper(
      () =>
        jsonResponse({
          kind: "blogger#postList",
          items: [{ id: "p1" }, { id: "p2" }],
          nextPageToken: "page-2",
        }),
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePosts(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items.map((p) => p.id)).toEqual(["p1", "p2"])
    expect(result.current.nextPageToken).toBe("page-2")
  })

  test("loadMore() fetches the next page and appends items instead of replacing them", async () => {
    let call = 0
    const wrapper = providerWrapper(
      () => {
        call += 1
        return call === 1
          ? jsonResponse({
              kind: "blogger#postList",
              items: [{ id: "p1" }],
              nextPageToken: "page-2",
            })
          : jsonResponse({ kind: "blogger#postList", items: [{ id: "p2" }] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePosts(), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(1))

    await act(async () => {
      result.current.loadMore()
    })
    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items.map((p) => p.id)).toEqual(["p1", "p2"])
    expect(result.current.nextPageToken).toBeUndefined()
  })

  test("refetch() resets accumulated items back to a single fresh page", async () => {
    let call = 0
    const wrapper = providerWrapper(
      () => {
        call += 1
        return jsonResponse({ kind: "blogger#postList", items: [{ id: `fresh-${call}` }] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePosts(), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(1))
    const firstId = result.current.items[0]?.id

    await act(async () => {
      result.current.refetch()
    })
    await waitFor(() => expect(result.current.items[0]?.id).not.toBe(firstId))
    expect(result.current.items.length).toBe(1)
  })
})
