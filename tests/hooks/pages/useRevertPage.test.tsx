import { describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import type { QueryStore } from "../../../src/cache/queryStore"
import { useBlogger } from "../../../src/context/BloggerContext"
import { BloggerProvider } from "../../../src/context/BloggerProvider"
import { useRevertPage } from "../../../src/hooks/pages/useRevertPage"
import type { Page } from "../../../src/types/resources"
import { buildKey } from "../../../src/utils/queryKey"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useRevertPage", () => {
  test("reverts a page via POST and resolves with the reverted page", async () => {
    const captured: { method: string | null; url: URL | null } = {
      method: null,
      url: null,
    }
    const wrapper = providerWrapper(
      async (request) => {
        captured.method = request.method
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page", id: "page-1", status: "DRAFT" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useRevertPage(), { wrapper })

    let reverted: Page | undefined
    await act(async () => {
      reverted = await result.current.mutateAsync({ pageId: "page-1" })
    })

    expect(captured.method).toBe("POST")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages/page-1/revert")
    expect(reverted?.id).toBe("page-1")
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
            fetch: async () => jsonResponse({ kind: "blogger#page", id: "page-1" }),
          }}
        >
          <CaptureStore>{children}</CaptureStore>
        </BloggerProvider>
      )
    }
    const { result } = renderHook(() => useRevertPage(), { wrapper: Wrapper })
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
