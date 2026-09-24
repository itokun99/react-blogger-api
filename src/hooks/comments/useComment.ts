import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toCommentId, toPostId } from "../../types/ids"
import type { ViewType } from "../../types/params"
import type { Comment } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseCommentParams {
  readonly view?: ViewType | undefined
}

export interface UseCommentOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

/** Fetches a single Blogger comment by id (`blogger.comments.get`). */
export function useComment(
  postId: string,
  commentId: string,
  params: UseCommentParams = {},
  options: UseCommentOptions = {},
): UseBloggerQueryResult<Comment> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const id = toPostId(postId)
  const brandedCommentId = toCommentId(commentId)

  return useBloggerQuery({
    store,
    key: resolvedBlogId
      ? buildKey(["comments", "get", resolvedBlogId, id, brandedCommentId, { ...params }])
      : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "useComment requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.comments.get(
        { blogId: resolvedBlogId, postId: id, commentId: brandedCommentId, ...params },
        signal,
      )
    },
  })
}
