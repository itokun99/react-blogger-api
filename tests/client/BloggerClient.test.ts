import { describe, expect, test } from "bun:test"
import { createBloggerClient } from "../../src/client/BloggerClient"
import { toBlogId } from "../../src/types/ids"
import { jsonResponse, mockFetch } from "../helpers/mockFetch"

describe("createBloggerClient", () => {
  test("wires all 8 resource namespaces to one shared, auth-configured http client", async () => {
    const captured: { auth: string | null } = { auth: null }
    const client = createBloggerClient({
      accessToken: "token-xyz",
      fetch: mockFetch((request) => {
        captured.auth = request.headers.get("authorization")
        return jsonResponse({ kind: "blogger#blog", id: "blog-1", name: "My Blog" })
      }),
    })
    expect(client.blogs).toBeDefined()
    expect(client.posts).toBeDefined()
    expect(client.pages).toBeDefined()
    expect(client.comments).toBeDefined()
    expect(client.users).toBeDefined()
    expect(client.pageViews).toBeDefined()
    expect(client.postUserInfos).toBeDefined()
    expect(client.blogUserInfos).toBeDefined()

    const blog = await client.blogs.get({ blogId: toBlogId("blog-1") })
    expect(blog.name).toBe("My Blog")
    expect(captured.auth).toBe("Bearer token-xyz")
  })
})
