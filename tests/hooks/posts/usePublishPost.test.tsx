import { describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import type { QueryStore } from "../../../src/cache/queryStore"
import { useBlogger } from "../../../src/context/BloggerContext"
import { BloggerProvider } from "../../../src/context/BloggerProvider"
import { usePublishPost } from "../../../src/hooks/posts/usePublishPost"
import type { Post } from "../../../src/types/resources"
import { buildKey } from "../../../src/utils/queryKey"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePublishPost", () => {
  test("publishes the post with POST and resolves with the published post", async () => {
    const captured: { method: string | null; url: URL | null } = {
      method: null,
      url: null,
    }
    const wrapper = providerWrapper(
      async (request) => {
        captured.method = request.method
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1", status: "LIVE" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePublishPost(), { wrapper })

    let published: Post | undefined
    await act(async () => {
      published = await result.current.mutateAsync({ postId: "post-1" })
    })

    expect(captured.method).toBe("POST")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/publish")
    expect(published?.id as string).toBe("post-1")
    expect(result.current.status).toBe("success")
  })

  test("passes publishDate as a query param when given", async () => {
    const captured: { url: URL | null } = { url: null }
    const wrapper = providerWrapper(
      async (request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePublishPost(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ postId: "post-1", publishDate: "2024-01-01T00:00:00Z" })
    })

    expect(captured.url?.search).toContain("publishDate=2024-01-01T00%3A00%3A00Z")
  })

  test("on success, invalidates cached posts:list, posts:search and posts:get entries for that blogId/postId", async () => {
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
            fetch: async () => jsonResponse({ kind: "blogger#post", id: "post-1" }),
          }}
        >
          <CaptureStore>{children}</CaptureStore>
        </BloggerProvider>
      )
    }
    const { result } = renderHook(() => usePublishPost(), { wrapper: Wrapper })
    const store = capturedStore
    if (!store) throw new Error("store was not captured")

    const listKey = buildKey(["posts", "list", "blog-1", { maxResults: 10 }])
    const searchKey = buildKey(["posts", "search", "blog-1", { q: "hi" }])
    const getKey = buildKey(["posts", "get", "blog-1", "post-1", {}])
    const unrelatedKey = buildKey(["pages", "list", "blog-1"])
    await store.fetchOnce(listKey, () => Promise.resolve("cached-list"))
    await store.fetchOnce(searchKey, () => Promise.resolve("cached-search"))
    await store.fetchOnce(getKey, () => Promise.resolve("cached-get"))
    await store.fetchOnce(unrelatedKey, () => Promise.resolve("cached-pages"))

    await act(async () => {
      await result.current.mutateAsync({ postId: "post-1" })
    })

    expect(store.getSnapshot(listKey).data).toBeUndefined()
    expect(store.getSnapshot(searchKey).data).toBeUndefined()
    expect(store.getSnapshot(getKey).data).toBeUndefined()
    expect(store.getSnapshot(unrelatedKey).data).toBe("cached-pages")
  })
})
