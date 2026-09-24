import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId } from "../../types/ids"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface DeletePostArgs {
  readonly blogId?: string
  readonly postId: string
  readonly useTrash?: boolean | undefined
}

/** Deletes a Blogger post (`blogger.posts.delete`); invalidates cached lists/searches/gets for its blog. */
export function useDeletePost(): UseBloggerMutationResult<DeletePostArgs, void> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: DeletePostArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useDeletePost requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const postId = toPostId(args.postId)
      await client.posts.delete({ blogId, postId, useTrash: args.useTrash })
      const listPrefix = buildKey(["posts", "list", blogId])
      const searchPrefix = buildKey(["posts", "search", blogId])
      const getPrefix = buildKey(["posts", "get", blogId, postId])
      store.invalidate(
        (key) =>
          key.startsWith(listPrefix) || key.startsWith(searchPrefix) || key.startsWith(getPrefix),
      )
    },
  })
}
