import { describe, expect, test } from "bun:test"
import { createHttpClient } from "../../../src/client/request"
import { createPostsResource } from "../../../src/client/resources/posts"
import { toBlogId, toPostId } from "../../../src/types/ids"
import { jsonResponse, mockFetch } from "../../helpers/mockFetch"

const BLOG_ID = toBlogId("blog-1")
const POST_ID = toPostId("post-1")

describe("createPostsResource", () => {
  test("list() issues a GET to v3/blogs/{blogId}/posts, expanding repeated status filters", async () => {
    const captured: { url: URL | null; method: string | null } = { url: null, method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        captured.method = request.method
        return jsonResponse({ kind: "blogger#postList", items: [] })
      }),
    })
    const posts = createPostsResource(http)
    const result = await posts.list({ blogId: BLOG_ID, status: ["LIVE", "DRAFT"], maxResults: 10 })
    expect(captured.method).toBe("GET")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts")
    expect(captured.url?.searchParams.getAll("status")).toEqual(["LIVE", "DRAFT"])
    expect(captured.url?.searchParams.get("maxResults")).toBe("10")
    expect(result.items).toEqual([])
  })

  test("get() issues a GET to v3/blogs/{blogId}/posts/{postId} and parses the Post", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1", title: "Hello" })
      }),
    })
    const posts = createPostsResource(http)
    const result = await posts.get({ blogId: BLOG_ID, postId: POST_ID, fetchBody: true })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1")
    expect(captured.url?.searchParams.get("fetchBody")).toBe("true")
    expect(result.title).toBe("Hello")
  })

  test("getByPath() issues a GET to v3/blogs/{blogId}/posts/bypath with the path query param", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1" })
      }),
    })
    const posts = createPostsResource(http)
    await posts.getByPath({ blogId: BLOG_ID, path: "/2024/01/hello.html" })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/bypath")
    expect(captured.url?.searchParams.get("path")).toBe("/2024/01/hello.html")
  })

  test("search() issues a GET to v3/blogs/{blogId}/posts/search with the q param", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#postList", items: [] })
      }),
    })
    const posts = createPostsResource(http)
    await posts.search({ blogId: BLOG_ID, q: "hello world" })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/search")
    expect(captured.url?.searchParams.get("q")).toBe("hello world")
  })

  test("insert() issues a POST with the post body and returns the created Post", async () => {
    const captured: { method: string | null; body: unknown } = { method: null, body: null }
    const http = createHttpClient({
      fetch: mockFetch(async (request) => {
        captured.method = request.method
        captured.body = await request.json()
        return jsonResponse({ kind: "blogger#post", id: "post-new", title: "New" }, 200)
      }),
    })
    const posts = createPostsResource(http)
    const result = await posts.insert({ blogId: BLOG_ID }, { title: "New", content: "<p>Body</p>" })
    expect(captured.method).toBe("POST")
    expect(captured.body).toEqual({ title: "New", content: "<p>Body</p>" })
    expect(result.id).toBe("post-new")
  })

  test("update() issues a PUT with the full post body", async () => {
    const captured: { method: string | null } = { method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.method = request.method
        return jsonResponse({ kind: "blogger#post", id: "post-1", title: "Updated" })
      }),
    })
    const posts = createPostsResource(http)
    const result = await posts.update({ blogId: BLOG_ID, postId: POST_ID }, { title: "Updated" })
    expect(captured.method).toBe("PUT")
    expect(result.title).toBe("Updated")
  })

  test("patch() issues a PATCH with a partial post body", async () => {
    const captured: { method: string | null; body: unknown } = { method: null, body: null }
    const http = createHttpClient({
      fetch: mockFetch(async (request) => {
        captured.method = request.method
        captured.body = await request.json()
        return jsonResponse({ kind: "blogger#post", id: "post-1", title: "Patched" })
      }),
    })
    const posts = createPostsResource(http)
    await posts.patch({ blogId: BLOG_ID, postId: POST_ID }, { title: "Patched" })
    expect(captured.method).toBe("PATCH")
    expect(captured.body).toEqual({ title: "Patched" })
  })

  test("delete() issues a DELETE and resolves without a body", async () => {
    const captured: { method: string | null; url: URL | null } = { method: null, url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.method = request.method
        captured.url = new URL(request.url)
        return new Response(null, { status: 204 })
      }),
    })
    const posts = createPostsResource(http)
    await expect(
      posts.delete({ blogId: BLOG_ID, postId: POST_ID, useTrash: true }),
    ).resolves.toBeUndefined()
    expect(captured.method).toBe("DELETE")
    expect(captured.url?.searchParams.get("useTrash")).toBe("true")
  })

  test("publish() issues a POST to the publish action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1", status: "LIVE" })
      }),
    })
    const posts = createPostsResource(http)
    const result = await posts.publish({ blogId: BLOG_ID, postId: POST_ID })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/publish")
    expect(result.status).toBe("LIVE")
  })

  test("revert() issues a POST to the revert action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#post", id: "post-1", status: "DRAFT" })
      }),
    })
    const posts = createPostsResource(http)
    const result = await posts.revert({ blogId: BLOG_ID, postId: POST_ID })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/posts/post-1/revert")
    expect(result.status).toBe("DRAFT")
  })
})
