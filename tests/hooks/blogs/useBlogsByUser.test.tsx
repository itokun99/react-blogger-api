import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useBlogsByUser } from "../../../src/hooks/blogs/useBlogsByUser"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useBlogsByUser", () => {
  test("defaults to userId 'self' when no id is given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper((request) => {
      captured.url = new URL(request.url)
      return jsonResponse({
        kind: "blogger#blogList",
        items: [{ kind: "blogger#blog", id: "blog-1" }],
      })
    })
    const { result } = renderHook(() => useBlogsByUser(), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/self/blogs")
  })

  test("uses an explicit userId when given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper((request) => {
      captured.url = new URL(request.url)
      return jsonResponse({ kind: "blogger#blogList", items: [] })
    })
    const { result } = renderHook(() => useBlogsByUser("user-2"), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/user-2/blogs")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(() => {
      calls += 1
      return jsonResponse({ kind: "blogger#blogList", items: [] })
    })
    renderHook(() => useBlogsByUser("self", {}, { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
