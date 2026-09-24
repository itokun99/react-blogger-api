import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePageViews } from "../../../src/hooks/misc/usePageViews"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePageViews", () => {
  test("resolves page views using the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({
          kind: "blogger#pageviews",
          blogId: "blog-1",
          counts: [{ timeRange: "ALL_TIME", count: "1000" }],
        })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePageViews(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() =>
      expect(result.current.data?.counts).toEqual([{ timeRange: "ALL_TIME", count: "1000" }]),
    )
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-default/pageviews")
  })

  test("an explicit blogId option overrides the provider's defaultBlogId", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#pageviews", blogId: "blog-2", counts: [] })
      },
      { defaultBlogId: "blog-default" },
    )
    const { result } = renderHook(() => usePageViews({}, { blogId: "blog-explicit" }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-explicit/pageviews")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(
      () => {
        calls += 1
        return jsonResponse({ kind: "blogger#pageviews", blogId: "blog-1", counts: [] })
      },
      { defaultBlogId: "blog-1" },
    )
    renderHook(() => usePageViews({}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
