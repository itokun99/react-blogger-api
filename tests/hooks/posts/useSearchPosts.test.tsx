import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useSearchPosts } from "../../../src/hooks/posts/useSearchPosts"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useSearchPosts", () => {
  test("resolves posts using the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#postList",
          items: [{ kind: "blogger#post", id: "post-1", title: "Hello" }],
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useSearchPosts("hello"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data?.items?.[0]?.title).toBe("Hello"))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-default/posts/search")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#postList",
          items: [],
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useSearchPosts("hello", {}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/posts/search")
  })

  test("passes q, fetchBodies and orderBy as query params", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#postList", items: [] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(
      () => useSearchPosts("test", { fetchBodies: true, orderBy: "PUBLISHED" }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.search).toContain("q=test")
    expect(captured.url?.search).toContain("fetchBodies=true")
    expect(captured.url?.search).toContain("orderBy=PUBLISHED")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#postList", items: [] })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => useSearchPosts("hello", {}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
