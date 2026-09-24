import { describe, expect, test } from "bun:test"
import { createHttpClient } from "../../../src/client/request"
import { createBlogsResource } from "../../../src/client/resources/blogs"
import { toBlogId, toUserId } from "../../../src/types/ids"
import { jsonResponse, mockFetch } from "../../helpers/mockFetch"

const BLOG_ID = toBlogId("blog-1")
const USER_ID = toUserId("user-1")

describe("createBlogsResource", () => {
  test("get() issues a GET to v3/blogs/{blogId}", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#blog", id: "blog-1", name: "My Blog" })
      }),
    })
    const blogs = createBlogsResource(http)
    const result = await blogs.get({ blogId: BLOG_ID, maxPosts: 5 })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1")
    expect(captured.url?.searchParams.get("maxPosts")).toBe("5")
    expect(result.name).toBe("My Blog")
  })

  test("getByUrl() issues a GET to v3/blogs/byurl with the url query param", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#blog", id: "blog-1", name: "My Blog" })
      }),
    })
    const blogs = createBlogsResource(http)
    await blogs.getByUrl({ url: "https://example.blogspot.com" })
    expect(captured.url?.pathname).toBe("/v3/blogs/byurl")
    expect(captured.url?.searchParams.get("url")).toBe("https://example.blogspot.com")
  })

  test("listByUser() issues a GET to v3/users/{userId}/blogs, expanding repeated status/role", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#blogList", items: [] })
      }),
    })
    const blogs = createBlogsResource(http)
    const result = await blogs.listByUser({
      userId: USER_ID,
      status: ["LIVE", "DELETED"],
      role: ["ADMIN", "AUTHOR"],
    })
    expect(captured.url?.pathname).toBe("/v3/users/user-1/blogs")
    expect(captured.url?.searchParams.getAll("status")).toEqual(["LIVE", "DELETED"])
    expect(captured.url?.searchParams.getAll("role")).toEqual(["ADMIN", "AUTHOR"])
    expect(result.items).toEqual([])
  })
})
