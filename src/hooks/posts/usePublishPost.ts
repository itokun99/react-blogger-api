import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId } from "../../types/ids"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface PublishPostArgs {
  readonly blogId?: string
  readonly postId: string
  readonly publishDate?: string | undefined
}

/** Publishes a Blogger post (`blogger.posts.publish`); invalidates cached lists/searches/gets for its blog. */
export function usePublishPost(): UseBloggerMutationResult<PublishPostArgs, Post> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: PublishPostArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "usePublishPost requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const postId = toPostId(args.postId)
      const result = await client.posts.publish({ blogId, postId, publishDate: args.publishDate })
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
