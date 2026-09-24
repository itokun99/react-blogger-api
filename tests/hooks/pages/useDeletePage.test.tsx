import { describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import type { QueryStore } from "../../../src/cache/queryStore"
import { useBlogger } from "../../../src/context/BloggerContext"
import { BloggerProvider } from "../../../src/context/BloggerProvider"
import { useDeletePage } from "../../../src/hooks/pages/useDeletePage"
import { buildKey } from "../../../src/utils/queryKey"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useDeletePage", () => {
  test("deletes a page via DELETE and resolves with undefined", async () => {
    const captured: { method: string | null; url: URL | null } = {
      method: null,
      url: null,
    }
    const wrapper = providerWrapper(
      async (request) => {
        captured.method = request.method
        captured.url = new URL(request.url)
        return new Response(null, { status: 204 })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useDeletePage(), { wrapper })

    let deleted: unknown
    await act(async () => {
      deleted = await result.current.mutateAsync({ pageId: "page-1" })
    })

    expect(captured.method).toBe("DELETE")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages/page-1")
    expect(deleted).toBeUndefined()
    expect(result.current.status).toBe("success")
  })

  test("on success, invalidates cached pages:list and pages:get entries for that blogId/pageId", async () => {
    let capturedStore: QueryStore | undefined
    function CaptureStore({ children }: { children: ReactNode }) {
      capturedStore = useBlogger().store
      return <>{children}</>
    }
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <BloggerProvider
          config={{
            defaultBlogId: "blog-1",
            fetch: async () => new Response(null, { status: 204 }),
          }}
        >
          <CaptureStore>{children}</CaptureStore>
        </BloggerProvider>
      )
    }
    const { result } = renderHook(() => useDeletePage(), { wrapper: Wrapper })
    const store = capturedStore
    if (!store) throw new Error("store was not captured")

    const listKey = buildKey(["pages", "list", "blog-1", { maxResults: 10 }])
    const getKey = buildKey(["pages", "get", "blog-1", "page-1"])
    const unrelatedKey = buildKey(["posts", "list", "blog-1"])
    await store.fetchOnce(listKey, () => Promise.resolve("cached-list"))
    await store.fetchOnce(getKey, () => Promise.resolve("cached-get"))
    await store.fetchOnce(unrelatedKey, () => Promise.resolve("cached-posts"))

    await act(async () => {
      await result.current.mutateAsync({ pageId: "page-1" })
    })

    expect(store.getSnapshot(listKey).data).toBeUndefined()
    expect(store.getSnapshot(getKey).data).toBeUndefined()
    expect(store.getSnapshot(unrelatedKey).data).toBe("cached-posts")
  })
})
