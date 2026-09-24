import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId } from "../../types/ids"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"
import type { UpdatePostArgs } from "./useUpdatePost"

export type PatchPostArgs = UpdatePostArgs

/** Patches a Blogger post (`blogger.posts.patch`); invalidates cached lists/searches/gets for its blog. */
export function usePatchPost(): UseBloggerMutationResult<PatchPostArgs, Post> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: PatchPostArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "usePatchPost requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const postId = toPostId(args.postId)
      const result = await client.posts.patch(
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
