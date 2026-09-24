import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId } from "../../types/ids"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface UpdatePostArgs {
  readonly blogId?: string
  readonly postId: string
  readonly post: Post
  readonly revert?: boolean | undefined
  readonly publish?: boolean | undefined
  readonly fetchImages?: boolean | undefined
  readonly fetchBody?: boolean | undefined
  readonly maxComments?: number | undefined
}

/** Updates a Blogger post (`blogger.posts.update`); invalidates cached lists/searches/gets for its blog. */
export function useUpdatePost(): UseBloggerMutationResult<UpdatePostArgs, Post> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: UpdatePostArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useUpdatePost requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const postId = toPostId(args.postId)
      const result = await client.posts.update(
        {
          blogId,
          postId,
          revert: args.revert,
          publish: args.publish,
          fetchImages: args.fetchImages,
          fetchBody: args.fetchBody,
          maxComments: args.maxComments,
        },
        args.post,
      )
      const listPrefix = buildKey(["posts", "list", blogId])
      const searchPrefix = buildKey(["posts", "search", blogId])
      const getPrefix = buildKey(["posts", "get", blogId, postId])
      store.invalidate(
        (key) =>
          key.startsWith(listPrefix) || key.startsWith(searchPrefix) || key.startsWith(getPrefix),
      )
      return result
    },
  })
}
