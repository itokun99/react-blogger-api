import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPageId } from "../../types/ids"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface DeletePageArgs {
  readonly blogId?: string
  readonly pageId: string
  readonly useTrash?: boolean
}

/** Deletes a Blogger page (`blogger.pages.delete`); invalidates cached lists and get entries for its blog/page. */
export function useDeletePage(): UseBloggerMutationResult<DeletePageArgs, void> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: DeletePageArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useDeletePage requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const pageId = toPageId(args.pageId)
      await client.pages.delete({ blogId, pageId, useTrash: args.useTrash })
      const listPrefix = buildKey(["pages", "list", blogId])
      const getKeyPrefix = buildKey(["pages", "get", blogId, pageId])
      store.invalidate((key) => key.startsWith(listPrefix) || key.startsWith(getKeyPrefix))
    },
  })
}
