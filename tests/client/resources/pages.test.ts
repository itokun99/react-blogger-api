import { describe, expect, test } from "bun:test"
import { createHttpClient } from "../../../src/client/request"
import { createPagesResource } from "../../../src/client/resources/pages"
import { toBlogId, toPageId } from "../../../src/types/ids"
import { jsonResponse, mockFetch } from "../../helpers/mockFetch"

const BLOG_ID = toBlogId("blog-1")
const PAGE_ID = toPageId("page-1")

describe("createPagesResource", () => {
  test("list() issues a GET to v3/blogs/{blogId}/pages", async () => {
    const captured: { url: URL | null; method: string | null } = { url: null, method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        captured.method = request.method
        return jsonResponse({ kind: "blogger#pageList", items: [] })
      }),
    })
    const pages = createPagesResource(http)
    const result = await pages.list({ blogId: BLOG_ID, status: ["LIVE", "DRAFT"] })
    expect(captured.method).toBe("GET")
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages")
    expect(captured.url?.searchParams.getAll("status")).toEqual(["LIVE", "DRAFT"])
    expect(result.items).toEqual([])
  })

  test("get() issues a GET to v3/blogs/{blogId}/pages/{pageId}", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page", id: "page-1", title: "About" })
      }),
    })
    const pages = createPagesResource(http)
    const result = await pages.get({ blogId: BLOG_ID, pageId: PAGE_ID })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages/page-1")
    expect(result.title).toBe("About")
  })

  test("insert() issues a POST with the page body", async () => {
    const captured: { method: string | null; body: unknown } = { method: null, body: null }
    const http = createHttpClient({
      fetch: mockFetch(async (request) => {
        captured.method = request.method
        captured.body = await request.json()
        return jsonResponse({ kind: "blogger#page", id: "page-new", title: "New Page" })
      }),
    })
    const pages = createPagesResource(http)
    const result = await pages.insert({ blogId: BLOG_ID }, { title: "New Page" })
    expect(captured.method).toBe("POST")
    expect(captured.body).toEqual({ title: "New Page" })
    expect(result.id).toBe("page-new")
  })

  test("update() issues a PUT", async () => {
    const captured: { method: string | null } = { method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.method = request.method
        return jsonResponse({ kind: "blogger#page", id: "page-1", title: "Updated" })
      }),
    })
    const pages = createPagesResource(http)
    const result = await pages.update({ blogId: BLOG_ID, pageId: PAGE_ID }, { title: "Updated" })
    expect(captured.method).toBe("PUT")
    expect(result.title).toBe("Updated")
  })

  test("patch() issues a PATCH", async () => {
    const captured: { method: string | null } = { method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.method = request.method
        return jsonResponse({ kind: "blogger#page", id: "page-1", title: "Patched" })
      }),
    })
    const pages = createPagesResource(http)
    await pages.patch({ blogId: BLOG_ID, pageId: PAGE_ID }, { title: "Patched" })
    expect(captured.method).toBe("PATCH")
  })

  test("delete() issues a DELETE and resolves without a body", async () => {
    const captured: { method: string | null } = { method: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.method = request.method
        return new Response(null, { status: 204 })
      }),
    })
    const pages = createPagesResource(http)
    await expect(pages.delete({ blogId: BLOG_ID, pageId: PAGE_ID })).resolves.toBeUndefined()
    expect(captured.method).toBe("DELETE")
  })

  test("publish() issues a POST to the publish action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page", id: "page-1", status: "LIVE" })
      }),
    })
    const pages = createPagesResource(http)
    const result = await pages.publish({ blogId: BLOG_ID, pageId: PAGE_ID })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages/page-1/publish")
    expect(result.status).toBe("LIVE")
  })

  test("revert() issues a POST to the revert action path", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ kind: "blogger#page", id: "page-1", status: "DRAFT" })
      }),
    })
    const pages = createPagesResource(http)
    const result = await pages.revert({ blogId: BLOG_ID, pageId: PAGE_ID })
    expect(captured.url?.pathname).toBe("/v3/blogs/blog-1/pages/page-1/revert")
    expect(result.status).toBe("DRAFT")
  })
})
