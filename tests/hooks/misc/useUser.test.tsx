import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useUser } from "../../../src/hooks/misc/useUser"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useUser", () => {
  test("defaults to userId 'self' when no id is given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper((request) => {
      captured.url = new URL(request.url)
      return jsonResponse({ kind: "blogger#user", id: "u1", displayName: "Ada" })
    })
    const { result } = renderHook(() => useUser(), { wrapper })
    await waitFor(() => expect(result.current.data?.displayName).toBe("Ada"))
    expect(captured.url?.pathname).toBe("/v3/users/self")
  })

  test("uses an explicit userId when given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper((request) => {
      captured.url = new URL(request.url)
      return jsonResponse({ kind: "blogger#user", id: "u2" })
    })
    const { result } = renderHook(() => useUser("u2"), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(captured.url?.pathname).toBe("/v3/users/u2")
  })

  test("does not fetch when enabled is false", async () => {
    let calls = 0
    const wrapper = providerWrapper(() => {
      calls += 1
      return jsonResponse({ kind: "blogger#user", id: "u1" })
    })
    renderHook(() => useUser("self", { enabled: false }), { wrapper })
    await act(async () => {})
    expect(calls).toBe(0)
  })
})
