import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useBlogUserInfo } from "../../../src/hooks/misc/useBlogUserInfo"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useBlogUserInfo", () => {
  test("resolves blog user info using the provider's defaultBlogId and defaults userId to 'self'", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#blogUserInfo",
          blog: { kind: "blogger#blog", id: "blog-1" },
          blog_user_info: { role: "ADMIN" },
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useBlogUserInfo(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs/blog-default")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#blogUserInfo",
          blog: { kind: "blogger#blog", id: "blog-1" },
          blog_user_info: { role: "ADMIN" },
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useBlogUserInfo({ blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs/blog-explicit")
  })

  test("uses an explicit userId when given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#blogUserInfo",
          blog: { kind: "blogger#blog", id: "blog-1" },
          blog_user_info: { role: "ADMIN" },
        })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useBlogUserInfo({ userId: "user-2" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/user-2/blogs/blog-1")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({
          kind: "blogger#blogUserInfo",
          blog: { id: "blog-1" },
          blog_user_info: {},
        })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => useBlogUserInfo({ enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
