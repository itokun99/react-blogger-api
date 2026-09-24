import { describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import type { QueryStore } from "../../../src/cache/queryStore"
import { useBlogger } from "../../../src/context/BloggerContext"
import { BloggerProvider } from "../../../src/context/BloggerProvider"
import { usePatchPost } from "../../../src/hooks/posts/usePatchPost"
import type { Post } from "../../../src/types/resources"
import { buildKey } from "../../../src/utils/queryKey"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("usePatchPost", () => {
  test("posts to v3/blogs/{blogId}/posts/{postId} with PATCH and resolves with the patched post", async () => {
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
        return jsonResponse({ kind: "blogger#post", id: "post-1", title: "Patched" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => usePatchPost(), { wrapper })

    let patched: Post | undefined
    await act(async () => {
      patched = await result.current.mutateAsync({ postId: "post-1", post: { title: "Patched" } })
    })

    expect(captured.method).toBe("PATCH")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1")
    expect(captured.body).toEqual({ title: "Patched" })
    expect(patched?.id as string).toBe("post-1")
    expect(result.current.status).toBe("success")
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
    const { result } = renderHook(() => usePatchPost(), { wrapper: Wrapper })
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
      await result.current.mutateAsync({ postId: "post-1", post: { title: "Patched" } })
    })

    expect(store.getSnapshot(listKey).data).toBeUndefined()
    expect(store.getSnapshot(searchKey).data).toBeUndefined()
    expect(store.getSnapshot(getKey).data).toBeUndefined()
    expect(store.getSnapshot(unrelatedKey).data).toBe("cached-pages")
  })
})
