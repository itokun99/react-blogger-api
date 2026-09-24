import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPageId } from "../../types/ids"
import type { Page } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface RevertPageArgs {
  readonly blogId?: string
  readonly pageId: string
}

/** Reverts a published Blogger page to draft (`blogger.pages.revert`); invalidates cached lists and get entries for its blog/page. */
export function useRevertPage(): UseBloggerMutationResult<RevertPageArgs, Page> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: RevertPageArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useRevertPage requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const pageId = toPageId(args.pageId)
      const result = await client.pages.revert({ blogId, pageId })
      const listPrefix = buildKey(["pages", "list", blogId])
      const getKeyPrefix = buildKey(["pages", "get", blogId, pageId])
      store.invalidate((key) => key.startsWith(listPrefix) || key.startsWith(getKeyPrefix))
      return result
    },
  })
}
