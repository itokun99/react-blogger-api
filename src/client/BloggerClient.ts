import type { BloggerClientConfig } from "./config"
import { createHttpClient } from "./request"
import { type BlogsResource, createBlogsResource } from "./resources/blogs"
import { type CommentsResource, createCommentsResource } from "./resources/comments"
import {
  type BlogUserInfosResource,
  createMiscResources,
  type PageViewsResource,
  type PostUserInfosResource,
  type UsersResource,
} from "./resources/misc"
import { createPagesResource, type PagesResource } from "./resources/pages"
import { createPostsResource, type PostsResource } from "./resources/posts"

export interface BloggerClient {
  readonly blogs: BlogsResource
  readonly posts: PostsResource
  readonly pages: PagesResource
  readonly comments: CommentsResource
  readonly users: UsersResource
  readonly pageViews: PageViewsResource
  readonly postUserInfos: PostUserInfosResource
  readonly blogUserInfos: BlogUserInfosResource
}

export function createBloggerClient(config: BloggerClientConfig): BloggerClient {
  const http = createHttpClient(config)
  const misc = createMiscResources(http)
  return {
    blogs: createBlogsResource(http),
    posts: createPostsResource(http),
    pages: createPagesResource(http),
    comments: createCommentsResource(http),
    users: misc.users,
    pageViews: misc.pageViews,
    postUserInfos: misc.postUserInfos,
    blogUserInfos: misc.blogUserInfos,
  }
}

export type { BloggerClientConfig, FetchLike } from "./config"
