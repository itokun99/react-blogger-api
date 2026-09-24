import type { KyInstance } from "ky"
import type { BlogId, PostId } from "../../types/ids"
import { type PostList, PostListSchema } from "../../types/lists"
import type { OrderBy, PostStatus, SortOption, ViewType } from "../../types/params"
import { type Post, PostSchema } from "../../types/resources"
import { requestJson, requestVoid } from "../request"

export interface ListPostsParams {
  readonly blogId: BlogId
  readonly status?: readonly PostStatus[] | undefined
  readonly view?: ViewType | undefined
  readonly orderBy?: OrderBy | undefined
  readonly sortOption?: SortOption | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
  readonly labels?: string | undefined
  readonly maxResults?: number | undefined
  readonly pageToken?: string | undefined
  readonly fetchBodies?: boolean | undefined
  readonly fetchImages?: boolean | undefined
}

export interface GetPostParams {
  readonly blogId: BlogId
  readonly postId: PostId
  readonly view?: ViewType | undefined
  readonly fetchBody?: boolean | undefined
  readonly fetchImages?: boolean | undefined
  readonly maxComments?: number | undefined
}

export interface GetPostByPathParams {
  readonly blogId: BlogId
  readonly path: string
  readonly view?: ViewType | undefined
  readonly maxComments?: number | undefined
}

export interface SearchPostsParams {
  readonly blogId: BlogId
  readonly q: string
  readonly fetchBodies?: boolean | undefined
  readonly orderBy?: OrderBy | undefined
}

export interface InsertPostParams {
  readonly blogId: BlogId
  readonly isDraft?: boolean | undefined
  readonly fetchImages?: boolean | undefined
  readonly fetchBody?: boolean | undefined
}

export interface UpdatePostParams {
  readonly blogId: BlogId
  readonly postId: PostId
  readonly revert?: boolean | undefined
  readonly publish?: boolean | undefined
  readonly fetchImages?: boolean | undefined
  readonly fetchBody?: boolean | undefined
  readonly maxComments?: number | undefined
}

export type PatchPostParams = UpdatePostParams

export interface DeletePostParams {
  readonly blogId: BlogId
  readonly postId: PostId
  readonly useTrash?: boolean | undefined
}

export interface PublishPostParams {
  readonly blogId: BlogId
  readonly postId: PostId
  readonly publishDate?: string | undefined
}

export interface RevertPostParams {
  readonly blogId: BlogId
  readonly postId: PostId
}

export interface PostsResource {
  list(params: ListPostsParams, signal?: AbortSignal): Promise<PostList>
  get(params: GetPostParams, signal?: AbortSignal): Promise<Post>
  getByPath(params: GetPostByPathParams, signal?: AbortSignal): Promise<Post>
  search(params: SearchPostsParams, signal?: AbortSignal): Promise<PostList>
  insert(params: InsertPostParams, body: Post, signal?: AbortSignal): Promise<Post>
  update(params: UpdatePostParams, body: Post, signal?: AbortSignal): Promise<Post>
  patch(params: PatchPostParams, body: Post, signal?: AbortSignal): Promise<Post>
  delete(params: DeletePostParams, signal?: AbortSignal): Promise<void>
  publish(params: PublishPostParams, signal?: AbortSignal): Promise<Post>
  revert(params: RevertPostParams, signal?: AbortSignal): Promise<Post>
}

export function createPostsResource(http: KyInstance): PostsResource {
  return {
    list({ blogId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/posts`, PostListSchema, {
        searchParams: query,
        signal,
      })
    },
    get({ blogId, postId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/posts/${postId}`, PostSchema, {
        searchParams: query,
        signal,
      })
    },
    getByPath({ blogId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/posts/bypath`, PostSchema, {
        searchParams: query,
        signal,
      })
    },
    search({ blogId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/posts/search`, PostListSchema, {
        searchParams: query,
        signal,
      })
    },
    insert({ blogId, ...query }, body, signal) {
      return requestJson(http, "post", `v3/blogs/${blogId}/posts`, PostSchema, {
        searchParams: query,
        json: body,
        signal,
      })
    },
    update({ blogId, postId, ...query }, body, signal) {
      return requestJson(http, "put", `v3/blogs/${blogId}/posts/${postId}`, PostSchema, {
        searchParams: query,
        json: body,
        signal,
      })
    },
    patch({ blogId, postId, ...query }, body, signal) {
      return requestJson(http, "patch", `v3/blogs/${blogId}/posts/${postId}`, PostSchema, {
        searchParams: query,
        json: body,
        signal,
      })
    },
    delete({ blogId, postId, ...query }, signal) {
      return requestVoid(http, "delete", `v3/blogs/${blogId}/posts/${postId}`, {
        searchParams: query,
        signal,
      })
    },
    publish({ blogId, postId, ...query }, signal) {
      return requestJson(http, "post", `v3/blogs/${blogId}/posts/${postId}/publish`, PostSchema, {
        searchParams: query,
        signal,
      })
    },
    revert({ blogId, postId }, signal) {
      return requestJson(http, "post", `v3/blogs/${blogId}/posts/${postId}/revert`, PostSchema, {
        signal,
      })
    },
  }
}
