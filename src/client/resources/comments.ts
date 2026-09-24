import type { KyInstance } from "ky"
import type { BlogId, CommentId, PostId } from "../../types/ids"
import { type CommentList, CommentListSchema } from "../../types/lists"
import type { CommentStatus, ViewType } from "../../types/params"
import { type Comment, CommentSchema } from "../../types/resources"
import { requestJson, requestVoid } from "../request"

export interface ListCommentsParams {
  readonly blogId: BlogId
  readonly postId: PostId
  readonly status?: CommentStatus | undefined
  readonly view?: ViewType | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly pageToken?: string | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
}

export interface ListCommentsByBlogParams {
  readonly blogId: BlogId
  readonly status?: readonly CommentStatus[] | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly pageToken?: string | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
}

export interface GetCommentParams {
  readonly blogId: BlogId
  readonly postId: PostId
  readonly commentId: CommentId
  readonly view?: ViewType | undefined
}

export type DeleteCommentParams = Omit<GetCommentParams, "view">
export type ApproveCommentParams = DeleteCommentParams
export type MarkCommentAsSpamParams = DeleteCommentParams
export type RemoveCommentContentParams = DeleteCommentParams

export interface CommentsResource {
  list(params: ListCommentsParams, signal?: AbortSignal): Promise<CommentList>
  listByBlog(params: ListCommentsByBlogParams, signal?: AbortSignal): Promise<CommentList>
  get(params: GetCommentParams, signal?: AbortSignal): Promise<Comment>
  delete(params: DeleteCommentParams, signal?: AbortSignal): Promise<void>
  approve(params: ApproveCommentParams, signal?: AbortSignal): Promise<Comment>
  markAsSpam(params: MarkCommentAsSpamParams, signal?: AbortSignal): Promise<Comment>
  removeContent(params: RemoveCommentContentParams, signal?: AbortSignal): Promise<Comment>
}

export function createCommentsResource(http: KyInstance): CommentsResource {
  return {
    list({ blogId, postId, ...query }, signal) {
      return requestJson(
        http,
        "get",
        `v3/blogs/${blogId}/posts/${postId}/comments`,
        CommentListSchema,
        { searchParams: query, signal },
      )
    },
    listByBlog({ blogId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/comments`, CommentListSchema, {
        searchParams: query,
        signal,
      })
    },
    get({ blogId, postId, commentId, ...query }, signal) {
      return requestJson(
        http,
        "get",
        `v3/blogs/${blogId}/posts/${postId}/comments/${commentId}`,
        CommentSchema,
        { searchParams: query, signal },
      )
    },
    delete({ blogId, postId, commentId }, signal) {
      return requestVoid(
        http,
        "delete",
        `v3/blogs/${blogId}/posts/${postId}/comments/${commentId}`,
        {
          signal,
        },
      )
    },
    approve({ blogId, postId, commentId }, signal) {
      return requestJson(
        http,
        "post",
        `v3/blogs/${blogId}/posts/${postId}/comments/${commentId}/approve`,
        CommentSchema,
        { signal },
      )
    },
    markAsSpam({ blogId, postId, commentId }, signal) {
      return requestJson(
        http,
        "post",
        `v3/blogs/${blogId}/posts/${postId}/comments/${commentId}/spam`,
        CommentSchema,
        { signal },
      )
    },
    removeContent({ blogId, postId, commentId }, signal) {
      return requestJson(
        http,
        "post",
        `v3/blogs/${blogId}/posts/${postId}/comments/${commentId}/removecontent`,
        CommentSchema,
        { signal },
      )
    },
  }
}
