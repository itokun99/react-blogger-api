import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toCommentId, toPostId } from "../../types/ids"
import type { Comment } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface RemoveCommentContentArgs {
  readonly blogId?: string
  readonly postId: string
  readonly commentId: string
}

/** Removes the content of a Blogger comment (`blogger.comments.removeContent`); invalidates cached comment lists. */
export function useRemoveCommentContent(): UseBloggerMutationResult<
  RemoveCommentContentArgs,
  Comment
> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useRemoveCommentContent requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const postId = toPostId(args.postId)
      const commentId = toCommentId(args.commentId)
      const result = await client.comments.removeContent({ blogId, postId, commentId })
      const listPrefix = buildKey(["comments", "list", blogId, postId])
      const listByBlogPrefix = buildKey(["comments", "listByBlog", blogId])
      const getPrefix = buildKey(["comments", "get", blogId, postId, commentId])
      store.invalidate(
        (key) =>
          key.startsWith(listPrefix) ||
          key.startsWith(listByBlogPrefix) ||
          key.startsWith(getPrefix),
      )
      return result
    },
  })
}
