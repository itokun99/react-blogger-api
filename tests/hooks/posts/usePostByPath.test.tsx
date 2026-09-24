import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePostByPath } from "../../../src/hooks/posts/usePostByPath"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePostByPath", () => {
  test("resolves the post using the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1", title: "Hello" })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePostByPath("hello-world"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data?.title).toBe("Hello"))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-default/posts/bypath")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1" })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(
      () => usePostByPath("hello-world", {}, { blogId: "blog-explicit" }),
      {
        wrapper,
      },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/posts/bypath")
  })

  test("passes view and maxComments as query params", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(
      () => usePostByPath("hello-world", { view: "READER", maxComments: 5 }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.search).toContain("view=READER")
    expect(captured.url?.search).toContain("maxComments=5")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#post", id: "post-1" })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => usePostByPath("hello-world", {}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
