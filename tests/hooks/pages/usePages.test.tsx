import { describe, expect, test } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { act } from "react"
import { usePages } from "../../../src/hooks/pages/usePages"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePages", () => {
  test("resolves the first page of pages for the provider's defaultBlogId", async () => {
    const wrapper = providerWrapper(
      () =>
        jsonResponse({
          kind: "blogger#pageList",
          items: [{ id: "pg-1" }, { id: "pg-2" }],
          nextPageToken: "page-2",
        }),
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePages(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items.map((p) => p.id)).toEqual(["pg-1", "pg-2"])
    expect(result.current.nextPageToken).toBe("page-2")
  })

  test("loadMore() fetches the next page and appends items instead of replacing them", async () => {
    let call = 0
    const wrapper = providerWrapper(
      () => {
        call += 1
        return call === 1
          ? jsonResponse({
              kind: "blogger#pageList",
              items: [{ id: "pg-1" }],
              nextPageToken: "page-2",
            })
          : jsonResponse({ kind: "blogger#pageList", items: [{ id: "pg-2" }] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePages(), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(1))

    await act(async () => {
      result.current.loadMore()
    })
    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items.map((p) => p.id)).toEqual(["pg-1", "pg-2"])
    expect(result.current.nextPageToken).toBeUndefined()
  })

  test("refetch() resets accumulated items back to a single fresh page", async () => {
    let call = 0
    const wrapper = providerWrapper(
      () => {
        call += 1
        return jsonResponse({ kind: "blogger#pageList", items: [{ id: `fresh-${call}` }] })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePages(), { wrapper })
    await waitFor(() => expect(result.current.items.length).toBe(1))
    const firstId = result.current.items[0]?.id

    await act(async () => {
      result.current.refetch()
    })
    await waitFor(() => expect(result.current.items[0]?.id).not.toBe(firstId))
    expect(result.current.items.length).toBe(1)
  })
})
