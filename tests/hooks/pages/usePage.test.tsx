import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePage } from "../../../src/hooks/pages/usePage"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePage", () => {
  test("resolves the page using the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page", id: "page-1", title: "Hello" })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePage("page-1"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data?.title).toBe("Hello"))
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-default/pages/page-1")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page", id: "page-1" })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePage("page-1", {}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/pages/page-1")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#page", id: "page-1" })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => usePage("page-1", {}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
