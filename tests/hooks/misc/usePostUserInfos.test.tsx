import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePostUserInfos } from "../../../src/hooks/misc/usePostUserInfos"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePostUserInfos", () => {
  test("resolves post user infos list using the provider's defaultBlogId and defaults userId to 'self'", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#postUserInfosList",
          items: [
            {
              kind: "blogger#postUserInfo",
              post: { id: "post-1" },
              post_user_info: { postId: "post-1" },
            },
          ],
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePostUserInfos(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs/blog-default/posts")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#postUserInfosList", items: [] })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePostUserInfos({}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs/blog-explicit/posts")
  })

  test("uses an explicit userId when given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#postUserInfosList", items: [] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePostUserInfos({}, { userId: "user-2" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/user-2/blogs/blog-1/posts")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#postUserInfosList", items: [] })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => usePostUserInfos({}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
