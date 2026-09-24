import { describe, expect, test } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { act } from "react"
import { useComments } from "../../../src/hooks/comments/useComments"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useComments", () => {
  test("resolves the first page of comments for the given postId", async () => {
    const wrapper = providerWrapper(
      () =>
        jsonResponse({
          kind: "blogger#commentList",
          items: [{ id: "c1" }, { id: "c2" }],
          nextPageToken: "page-2",
        }),
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useComments("post-1"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items.map((c) => c.id)).toEqual(["c1", "c2"])
    expect(result.current.nextPageToken).toBe("page-2")
  })

  test("loadMore() fetches the next page and appends items instead of replacing them", async () => {
    let call = 0
    const wrapper = providerWrapper(
      () => {
        call += 1
        return call === 1
          ? jsonResponse({
              kind: "blogger#commentList",
              items: [{ id: "c1" }],
              nextPageToken: "page-2",
            })
          : jsonResponse({ kind: "blogger#commentList", items: [{ id: "c2" }] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useComments("post-1"), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(1))

    await act(async () => {
      result.current.loadMore()
    })
    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items.map((c) => c.id)).toEqual(["c1", "c2"])
    expect(result.current.nextPageToken).toBeUndefined()
  })

  test("refetch() resets accumulated items back to a single fresh page", async () => {
    let call = 0
    const wrapper = providerWrapper(
      () => {
        call += 1
        return jsonResponse({ kind: "blogger#commentList", items: [{ id: `fresh-${call}` }] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useComments("post-1"), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(1))
    const firstId = result.current.items[0]?.id

    await act(async () => {
      result.current.refetch()
    })
    await waitFor(() => expect(result.current.items[0]?.id).not.toBe(firstId))
    expect(result.current.items.length).toBe(1)
  })

  test("respects explicit blogId option", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#commentList", items: [{ id: "c1" }] })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useComments("post-1", {}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.items.length).toBe(1))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/posts/post-1/comments")
  })
})
