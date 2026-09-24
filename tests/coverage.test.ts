import { describe, expect, test } from "bun:test"
import { createBloggerClient } from "../src/client/BloggerClient"
import * as hooks from "../src/hooks"

/**
 * The full Blogger API v3 resource -> method -> hook map, transcribed from
 * the live discovery doc (https://www.googleapis.com/discovery/v1/apis/blogger/v3/rest,
 * revision 20260917) captured during planning - see .omo/plans/react-blogger-api.md.
 * This is the goal's coverage criterion: every documented method must have
 * both a typed BloggerClient method and an exported public hook.
 */
const API_METHOD_TO_HOOK: Record<string, Record<string, string>> = {
  blogs: { get: "useBlog", getByUrl: "useBlogByUrl", listByUser: "useBlogsByUser" },
  posts: {
    list: "usePosts",
    get: "usePost",
    getByPath: "usePostByPath",
    search: "useSearchPosts",
    insert: "useCreatePost",
    update: "useUpdatePost",
    patch: "usePatchPost",
    delete: "useDeletePost",
    publish: "usePublishPost",
    revert: "useRevertPost",
  },
  pages: {
    list: "usePages",
    get: "usePage",
    insert: "useCreatePage",
    update: "useUpdatePage",
    patch: "usePatchPage",
    delete: "useDeletePage",
    publish: "usePublishPage",
    revert: "useRevertPage",
  },
  comments: {
    list: "useComments",
    listByBlog: "useCommentsByBlog",
    get: "useComment",
    delete: "useDeleteComment",
    approve: "useApproveComment",
    markAsSpam: "useMarkCommentAsSpam",
    removeContent: "useRemoveCommentContent",
  },
  users: { get: "useUser" },
  pageViews: { get: "usePageViews" },
  postUserInfos: { list: "usePostUserInfos", get: "usePostUserInfo" },
  blogUserInfos: { get: "useBlogUserInfo" },
}

const TOTAL_METHODS = Object.values(API_METHOD_TO_HOOK).reduce(
  (sum, methods) => sum + Object.keys(methods).length,
  0,
)

describe("Blogger API v3 coverage", () => {
  test("the map itself covers exactly 33 methods across 8 resources", () => {
    expect(Object.keys(API_METHOD_TO_HOOK)).toHaveLength(8)
    expect(TOTAL_METHODS).toBe(33)
  })

  test("every documented method has a corresponding typed BloggerClient method", () => {
    const client = createBloggerClient({ apiKey: "test-key" })
    const missing: string[] = []
    for (const [resource, methods] of Object.entries(API_METHOD_TO_HOOK)) {
      const resourceClient = (client as unknown as Record<string, Record<string, unknown>>)[
        resource
      ]
      for (const method of Object.keys(methods)) {
        if (typeof resourceClient?.[method] !== "function") {
          missing.push(`${resource}.${method}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  test("every documented method has a corresponding exported public hook", () => {
    const missing: string[] = []
    for (const [resource, methods] of Object.entries(API_METHOD_TO_HOOK)) {
      for (const [method, hookName] of Object.entries(methods)) {
        if (typeof (hooks as Record<string, unknown>)[hookName] !== "function") {
          missing.push(`${resource}.${method} -> ${hookName}`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})
