import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPageId } from "../../types/ids"
import type { Page } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface UpdatePageArgs {
  readonly blogId?: string
  readonly pageId: string
  readonly page: Page
  readonly revert?: boolean
  readonly publish?: boolean
}

/** Updates a Blogger page (`blogger.pages.update`); invalidates cached lists and get entries for its blog/page. */
export function useUpdatePage(): UseBloggerMutationResult<UpdatePageArgs, Page> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: UpdatePageArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useUpdatePage requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const pageId = toPageId(args.pageId)
      const result = await client.pages.update(
        { blogId, pageId, revert: args.revert, publish: args.publish },
        args.page,
      )
      const listPrefix = buildKey(["pages", "list", blogId])
      const getKeyPrefix = buildKey(["pages", "get", blogId, pageId])
      store.invalidate((key) => key.startsWith(listPrefix) || key.startsWith(getKeyPrefix))
      return result
    },
  })
}
