import type { KyInstance } from "ky"
import type { BlogId, PostId, UserId } from "../../types/ids"
import type { OrderBy, PageViewsRange, PostStatus, ViewType } from "../../types/params"
import { type Pageviews, PageviewsSchema, type User, UserSchema } from "../../types/resources"
import type { PostUserInfo, PostUserInfosList } from "../../types/userInfo"
import {
  type BlogUserInfo,
  BlogUserInfoSchema,
  PostUserInfoSchema,
  PostUserInfosListSchema,
} from "../../types/userInfo"
import { requestJson } from "../request"

export interface GetUserParams {
  readonly userId: UserId
}

export interface GetPageViewsParams {
  readonly blogId: BlogId
  readonly range?: readonly PageViewsRange[] | undefined
}

export interface ListPostUserInfosParams {
  readonly userId: UserId
  readonly blogId: BlogId
  readonly status?: readonly PostStatus[] | undefined
  readonly labels?: string | undefined
  readonly view?: ViewType | undefined
  readonly orderBy?: OrderBy | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly pageToken?: string | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
}

export interface GetPostUserInfoParams {
  readonly userId: UserId
  readonly blogId: BlogId
  readonly postId: PostId
  readonly maxComments?: number | undefined
}

export interface GetBlogUserInfoParams {
  readonly userId: UserId
  readonly blogId: BlogId
  readonly maxPosts?: number | undefined
}

export interface UsersResource {
  get(params: GetUserParams, signal?: AbortSignal): Promise<User>
}

export interface PageViewsResource {
  get(params: GetPageViewsParams, signal?: AbortSignal): Promise<Pageviews>
}

export interface PostUserInfosResource {
  list(params: ListPostUserInfosParams, signal?: AbortSignal): Promise<PostUserInfosList>
  get(params: GetPostUserInfoParams, signal?: AbortSignal): Promise<PostUserInfo>
}

export interface BlogUserInfosResource {
  get(params: GetBlogUserInfoParams, signal?: AbortSignal): Promise<BlogUserInfo>
}

export interface MiscResources {
  readonly users: UsersResource
  readonly pageViews: PageViewsResource
  readonly postUserInfos: PostUserInfosResource
  readonly blogUserInfos: BlogUserInfosResource
}

export function createMiscResources(http: KyInstance): MiscResources {
  return {
    users: {
      get({ userId }, signal) {
        return requestJson(http, "get", `v3/users/${userId}`, UserSchema, { signal })
      },
    },
    pageViews: {
      get({ blogId, ...query }, signal) {
        return requestJson(http, "get", `v3/blogs/${blogId}/pageviews`, PageviewsSchema, {
          searchParams: query,
          signal,
        })
      },
    },
    postUserInfos: {
      list({ userId, blogId, ...query }, signal) {
        return requestJson(
          http,
          "get",
          `v3/users/${userId}/blogs/${blogId}/posts`,
          PostUserInfosListSchema,
          { searchParams: query, signal },
        )
      },
      get({ userId, blogId, postId, ...query }, signal) {
        return requestJson(
          http,
          "get",
          `v3/users/${userId}/blogs/${blogId}/posts/${postId}`,
          PostUserInfoSchema,
          { searchParams: query, signal },
        )
      },
    },
    blogUserInfos: {
      get({ userId, blogId, ...query }, signal) {
        return requestJson(http, "get", `v3/users/${userId}/blogs/${blogId}`, BlogUserInfoSchema, {
          searchParams: query,
          signal,
        })
      },
    },
  }
}
