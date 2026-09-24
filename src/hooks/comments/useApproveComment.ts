import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toCommentId, toPostId } from "../../types/ids"
import type { Comment } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface ApproveCommentArgs {
  readonly blogId?: string
  readonly postId: string
  readonly commentId: string
}

/** Approves a Blogger comment (`blogger.comments.approve`); invalidates cached comment lists. */
export function useApproveComment(): UseBloggerMutationResult<ApproveCommentArgs, Comment> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useApproveComment requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const postId = toPostId(args.postId)
      const commentId = toCommentId(args.commentId)
      const result = await client.comments.approve({ blogId, postId, commentId })
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
