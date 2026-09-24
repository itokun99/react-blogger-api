import { describe, expect, test } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import type { QueryStore } from "../../../src/cache/queryStore"
import { useBlogger } from "../../../src/context/BloggerContext"
import { BloggerProvider } from "../../../src/context/BloggerProvider"
import { useApproveComment } from "../../../src/hooks/comments/useApproveComment"
import type { Comment } from "../../../src/types/resources"
import { buildKey } from "../../../src/utils/queryKey"
import { jsonResponse } from "../../helpers/mockFetch"
import { providerWrapper } from "../../helpers/renderWithBlogger"

describe("useApproveComment", () => {
  test("approves the comment via POST and resolves with the updated comment", async () => {
    const captured: { method: string | null; url: URL | null } = { method: null, url: null }
    const wrapper = providerWrapper(
      async (request) => {
        captured.method = request.method
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#comment", id: "comment-1", status: "LIVE" })
      },
      { defaultBlogId: "blog-1" },
    )
    const { result } = renderHook(() => useApproveComment(), { wrapper })

    let approved: Comment | undefined
    await act(async () => {
      approved = await result.current.mutateAsync({ postId: "post-1", commentId: "comment-1" })
    })

    expect(captured.method).toBe("POST")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/comments/comment-1/approve")
    expect(approved?.id).toBe("comment-1")
    expect(approved?.status).toBe("LIVE")
    expect(result.current.status).toBe("success")
  })

  test("on success, invalidates cached comments:list and comments:listByBlog entries for the blog", async () => {
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
            fetch: async () => jsonResponse({ kind: "blogger#comment", id: "comment-1" }),
          }}
        >
          <CaptureStore>{children}</CaptureStore>
        </BloggerProvider>
      )
    }
    const { result } = renderHook(() => useApproveComment(), { wrapper: Wrapper })
    const store = capturedStore
    if (!store) throw new Error("store was not captured")

    const listKey = buildKey(["comments", "list", "blog-1", "post-1", { status: "PENDING" }])
    const listByBlogKey = buildKey(["comments", "listByBlog", "blog-1", { status: "PENDING" }])
    const unrelatedKey = buildKey(["posts", "list", "blog-1"])
    await store.fetchOnce(listKey, () => Promise.resolve("cached-list"))
    await store.fetchOnce(listByBlogKey, () => Promise.resolve("cached-list-by-blog"))
    await store.fetchOnce(unrelatedKey, () => Promise.resolve("cached-posts"))

    await act(async () => {
      await result.current.mutateAsync({ postId: "post-1", commentId: "comment-1" })
    })

    expect(store.getSnapshot(listKey).data).toBeUndefined()
    expect(store.getSnapshot(listByBlogKey).data).toBeUndefined()
    expect(store.getSnapshot(unrelatedKey).data).toBe("cached-posts")
  })
})
