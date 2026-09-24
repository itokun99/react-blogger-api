import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePostUserInfo } from "../../../src/hooks/misc/usePostUserInfo"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePostUserInfo", () => {
  test("resolves post user info using the provider's defaultBlogId and defaults userId to 'self'", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#postUserInfo",
          post: { kind: "blogger#post", id: "post-1" },
          post_user_info: { postId: "post-1", hasEditAccess: true },
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePostUserInfo("post-1"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs/blog-default/posts/post-1")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#postUserInfo",
          post: { kind: "blogger#post", id: "post-1" },
          post_user_info: { postId: "post-1" },
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePostUserInfo("post-1", { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs/blog-explicit/posts/post-1")
  })

  test("uses an explicit userId when given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#postUserInfo",
          post: { kind: "blogger#post", id: "post-1" },
          post_user_info: { postId: "post-1" },
        })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePostUserInfo("post-1", { userId: "user-2" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/user-2/blogs/blog-1/posts/post-1")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({
          kind: "blogger#postUserInfo",
          post: { id: "post-1" },
          post_user_info: {},
        })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => usePostUserInfo("post-1", { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
