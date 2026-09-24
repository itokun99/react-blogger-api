import type { KyInstance } from "ky"
import type { BlogId, UserId } from "../../types/ids"
import { type BlogList, BlogListSchema } from "../../types/lists"
import type { BlogStatus, Role, ViewType } from "../../types/params"
import { type Blog, BlogSchema } from "../../types/resources"
import { requestJson } from "../request"

export interface GetBlogParams {
  readonly blogId: BlogId
  readonly view?: ViewType | undefined
  readonly maxPosts?: number | undefined
}

export interface GetBlogByUrlParams {
  readonly url: string
  readonly view?: ViewType | undefined
}

export interface ListBlogsByUserParams {
  readonly userId: UserId
  readonly status?: readonly BlogStatus[] | undefined
  readonly role?: readonly Role[] | undefined
  readonly view?: ViewType | undefined
  readonly fetchUserInfo?: boolean | undefined
}

export interface BlogsResource {
  get(params: GetBlogParams, signal?: AbortSignal): Promise<Blog>
  getByUrl(params: GetBlogByUrlParams, signal?: AbortSignal): Promise<Blog>
  listByUser(params: ListBlogsByUserParams, signal?: AbortSignal): Promise<BlogList>
}

export function createBlogsResource(http: KyInstance): BlogsResource {
  return {
    get({ blogId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}`, BlogSchema, {
        searchParams: query,
        signal,
      })
    },
    getByUrl(query, signal) {
      return requestJson(http, "get", "v3/blogs/byurl", BlogSchema, {
        searchParams: { ...query },
        signal,
      })
    },
    listByUser({ userId, ...query }, signal) {
      return requestJson(http, "get", `v3/users/${userId}/blogs`, BlogListSchema, {
        searchParams: query,
        signal,
      })
    },
  }
}
