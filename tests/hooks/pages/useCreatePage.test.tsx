import { describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import type { QueryStore } from "../../../src/cache/queryStore"
import { useBlogger } from "../../../src/context/BloggerContext"
import { BloggerProvider } from "../../../src/context/BloggerProvider"
import { useCreatePage } from "../../../src/hooks/pages/useCreatePage"
import type { Page } from "../../../src/types/resources"
import { buildKey } from "../../../src/utils/queryKey"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useCreatePage", () => {
  test("posts to v3/blogs/{blogId}/pages with the given body and resolves with the created page", async () => {
    const captured: { method: string | null; body: unknown; url: URL | null } = {
      method: null,
      body: null,
      url: null,
    }
    const wrapper = providerWrapper(
      async (request) => {
        captured.method = request.method
        captured.url = new URL(request.url)
        captured.body = await request.json()
        return jsonResponse({ kind: "blogger#page", id: "page-new", title: "New" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useCreatePage(), { wrapper })

    let created: Page | undefined
    await act(async () => {
      created = await result.current.mutateAsync({ page: { title: "New" } })
    })

    expect(captured.method).toBe("POST")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages")
    expect(captured.body).toEqual({ title: "New" })
    expect(created?.id).toBe("page-new")
    expect(result.current.status).toBe("success")
  })

  test("on success, invalidates cached pages:list entries for that blogId", async () => {
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
            fetch: async () => jsonResponse({ kind: "blogger#page", id: "page-new" }),
          }}
        >
          <CaptureStore>{children}</CaptureStore>
        </BloggerProvider>
      )
    }
    const { result } = renderHook(() => useCreatePage(), { wrapper: Wrapper })
    const store = capturedStore
    if (!store) throw new Error("store was not captured")

    const listKey = buildKey(["pages", "list", "blog-1", { maxResults: 10 }])
    const unrelatedKey = buildKey(["posts", "list", "blog-1"])
    await store.fetchOnce(listKey, () => Promise.resolve("cached-list"))
    await store.fetchOnce(unrelatedKey, () => Promise.resolve("cached-posts"))

    await act(async () => {
      await result.current.mutateAsync({ page: { title: "New" } })
    })

    expect(store.getSnapshot(listKey).data).toBeUndefined()
    expect(store.getSnapshot(unrelatedKey).data).toBe("cached-posts")
  })
})
