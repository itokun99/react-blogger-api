import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useBlogByUrl } from "../../../src/hooks/blogs/useBlogByUrl"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useBlogByUrl", () => {
  test("resolves the blog by URL", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper((request) => {
      captured.url = new URL(request.url)
      return jsonResponse({ kind: "blogger#blog", id: "blog-1", name: "URL Blog" })
    })
    const { result } = renderHook(() => useBlogByUrl("https://example.blogspot.com"), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data?.name).toBe("URL Blog"))
    expect(captured.url?.pathname).toBe("/v3/blogs/byurl")
    expect(captured.url?.searchParams.get("url")).toBe("https://example.blogspot.com")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(() => {
      calls += 1
      return jsonResponse({ kind: "blogger#blog", id: "blog-1" })
    })
    renderHook(() => useBlogByUrl("https://example.blogspot.com", {}, { enabled: false }), {
      wrapper,
    })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
