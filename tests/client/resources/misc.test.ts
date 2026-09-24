import { describe, expect, test } from "bun:test"
import { createHttpClient } from "../../../src/client/request"
import { createMiscResources } from "../../../src/client/resources/misc"
import { toBlogId, toPostId, toUserId } from "../../../src/types/ids"
import { jsonResponse, mockFetch } from "../../helpers/mockFetch"

const BLOG_ID = toBlogId("blog-1")
const USER_ID = toUserId("user-1")
const POST_ID = toPostId("post-1")

describe("createMiscResources", () => {
  test("users.get() issues a GET to v3/users/{userId}", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#user", id: "user-1", displayName: "Ada" })
      }),
    })
    const { users } = createMiscResources(http)
    const result = await users.get({ userId: USER_ID })
    expect(captured.url?.pathname).toBe("/v3/users/user-1")
    expect(result.displayName).toBe("Ada")
  })

  test("pageViews.get() issues a GET to v3/blogs/{blogId}/pageviews, expanding repeated range", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page_views", blogId: "blog-1", counts: [] })
      }),
    })
    const { pageViews } = createMiscResources(http)
    const result = await pageViews.get({ blogId: BLOG_ID, range: ["30DAYS", "7DAYS"] })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pageviews")
    expect(captured.url?.searchParams.getAll("range")).toEqual(["30DAYS", "7DAYS"])
    expect(result.blogId).toBe("blog-1")
  })

  test("postUserInfos.list() issues a GET to v3/users/{userId}/blogs/{blogId}/posts", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#postList", items: [] })
      }),
    })
    const { postUserInfos } = createMiscResources(http)
    const result = await postUserInfos.list({ userId: USER_ID, blogId: BLOG_ID })
    expect(captured.url?.pathname).toBe("/v3/users/user-1/blogs/blog-1/posts")
    expect(result.items).toEqual([])
  })

  test("postUserInfos.get() issues a GET to the fully-nested path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#postUserInfo" })
      }),
    })
    const { postUserInfos } = createMiscResources(http)
    await postUserInfos.get({ userId: USER_ID, blogId: BLOG_ID, postId: POST_ID })
    expect(captured.url?.pathname).toBe("/v3/users/user-1/blogs/blog-1/posts/post-1")
  })

  test("blogUserInfos.get() issues a GET to v3/users/{userId}/blogs/{blogId}", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#blogUserInfo" })
      }),
    })
    const { blogUserInfos } = createMiscResources(http)
    await blogUserInfos.get({ userId: USER_ID, blogId: BLOG_ID, maxPosts: 3 })
    expect(captured.url?.pathname).toBe("/v3/users/user-1/blogs/blog-1")
    expect(captured.url?.searchParams.get("maxPosts")).toBe("3")
  })
})
