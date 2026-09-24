import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useCommentsByBlog } from "../../../src/hooks/comments/useCommentsByBlog"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useCommentsByBlog", () => {
  test("resolves the first page of comments for the provider's defaultBlogId", async () => {
    const wrapper = providerWrapper(
      () =>
        jsonResponse({
          kind: "blogger#commentList",
          items: [{ id: "c1" }, { id: "c2" }],
          nextPageToken: "page-2",
        }),
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useCommentsByBlog(), { wrapper })
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
    const { result } = renderHook(() => useCommentsByBlog(), { wrapper })
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
    const { result } = renderHook(() => useCommentsByBlog(), { wrapper })
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
    const { result } = renderHook(() => useCommentsByBlog({}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.items.length).toBe(1))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/comments")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#commentList", items: [] })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => useCommentsByBlog({}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
