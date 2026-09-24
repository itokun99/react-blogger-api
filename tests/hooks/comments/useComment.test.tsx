import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useComment } from "../../../src/hooks/comments/useComment"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useComment", () => {
  test("resolves the comment using the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#comment",
          id: "comment-1",
          content: "Hello world",
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useComment("post-1", "comment-1"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data?.content).toBe("Hello world"))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-default/posts/post-1/comments/comment-1")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#comment",
          id: "comment-1",
          content: "Hello",
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(
      () => useComment("post-1", "comment-1", {}, { blogId: "blog-explicit" }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/posts/post-1/comments/comment-1")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#comment", id: "comment-1" })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => useComment("post-1", "comment-1", {}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
