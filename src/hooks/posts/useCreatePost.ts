import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface CreatePostArgs {
  readonly blogId?: string
  readonly post: Post
  readonly isDraft?: boolean
  readonly fetchImages?: boolean
  readonly fetchBody?: boolean
}

/** Creates a new Blogger post (`blogger.posts.insert`); invalidates cached lists/searches for its blog. */
export function useCreatePost(): UseBloggerMutationResult<CreatePostArgs, Post> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: CreatePostArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useCreatePost requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const result = await client.posts.insert(
        { blogId, isDraft: args.isDraft, fetchImages: args.fetchImages, fetchBody: args.fetchBody },
        args.post,
      )
      const listPrefix = buildKey(["posts", "list", blogId])
      const searchPrefix = buildKey(["posts", "search", blogId])
      store.invalidate((key) => key.startsWith(listPrefix) || key.startsWith(searchPrefix))
      return result
    },
  })
}
