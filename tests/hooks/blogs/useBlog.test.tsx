import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useBlog } from "../../../src/hooks/blogs/useBlog"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useBlog", () => {
  test("resolves the blog using the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#blog", id: "blog-1", name: "My Blog" })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useBlog(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data?.name).toBe("My Blog"))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-default")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#blog", id: "blog-1" })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => useBlog({}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#blog", id: "blog-1" })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => useBlog({}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
