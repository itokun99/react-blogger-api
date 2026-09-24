import { describe, expect, test } from "bun:test"
import { createHttpClient } from "../../../src/client/request"
import { createCommentsResource } from "../../../src/client/resources/comments"
import { toBlogId, toCommentId, toPostId } from "../../../src/types/ids"
import { jsonResponse, mockFetch } from "../../helpers/mockFetch"

const BLOG_ID = toBlogId("blog-1")
const POST_ID = toPostId("post-1")
const COMMENT_ID = toCommentId("comment-1")

describe("createCommentsResource", () => {
  test("list() issues a GET to v3/blogs/{blogId}/posts/{postId}/comments", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#commentList", items: [] })
      }),
    })
    const comments = createCommentsResource(http)
    const result = await comments.list({ blogId: BLOG_ID, postId: POST_ID, status: "LIVE" })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/comments")
    expect(captured.url?.searchParams.get("status")).toBe("LIVE")
    expect(result.items).toEqual([])
  })

  test("listByBlog() issues a GET to v3/blogs/{blogId}/comments, expanding repeated status", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#commentList", items: [] })
      }),
    })
    const comments = createCommentsResource(http)
    await comments.listByBlog({ blogId: BLOG_ID, status: ["LIVE", "SPAM"] })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/comments")
    expect(captured.url?.searchParams.getAll("status")).toEqual(["LIVE", "SPAM"])
  })

  test("get() issues a GET to the fully-nested comment path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#comment", id: "comment-1", content: "hi" })
      }),
    })
    const comments = createCommentsResource(http)
    const result = await comments.get({ blogId: BLOG_ID, postId: POST_ID, commentId: COMMENT_ID })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/comments/comment-1")
    expect(result.content).toBe("hi")
  })

  test("delete() issues a DELETE and resolves without a body", async () => {
    const captured: { method: string | null } = { method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.method = request.method
        return new Response(null, { status: 204 })
      }),
    })
    const comments = createCommentsResource(http)
    await expect(
      comments.delete({ blogId: BLOG_ID, postId: POST_ID, commentId: COMMENT_ID }),
    ).resolves.toBeUndefined()
    expect(captured.method).toBe("DELETE")
  })

  test("approve() issues a POST to the approve action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#comment", id: "comment-1", status: "LIVE" })
      }),
    })
    const comments = createCommentsResource(http)
    const result = await comments.approve({
      blogId: BLOG_ID,
      postId: POST_ID,
      commentId: COMMENT_ID,
    })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/comments/comment-1/approve")
    expect(result.status).toBe("LIVE")
  })

  test("markAsSpam() issues a POST to the spam action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#comment", id: "comment-1", status: "SPAM" })
      }),
    })
    const comments = createCommentsResource(http)
    const result = await comments.markAsSpam({
      blogId: BLOG_ID,
      postId: POST_ID,
      commentId: COMMENT_ID,
    })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/comments/comment-1/spam")
    expect(result.status).toBe("SPAM")
  })

  test("removeContent() issues a POST to the removecontent action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#comment", id: "comment-1", status: "EMPTIED" })
      }),
    })
    const comments = createCommentsResource(http)
    const result = await comments.removeContent({
      blogId: BLOG_ID,
      postId: POST_ID,
      commentId: COMMENT_ID,
    })
    expect(captured.url?.pathname).toBe(
      "/v3/blogs/blog-1/posts/post-1/comments/comment-1/removecontent",
    )
    expect(result.status).toBe("EMPTIED")
  })
})
