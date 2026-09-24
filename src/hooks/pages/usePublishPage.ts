import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPageId } from "../../types/ids"
import type { Page } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface PublishPageArgs {
  readonly blogId?: string
  readonly pageId: string
}

/** Publishes a Blogger page (`blogger.pages.publish`); invalidates cached lists and get entries for its blog/page. */
export function usePublishPage(): UseBloggerMutationResult<PublishPageArgs, Page> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: PublishPageArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "usePublishPage requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const pageId = toPageId(args.pageId)
      const result = await client.pages.publish({ blogId, pageId })
      const listPrefix = buildKey(["pages", "list", blogId])
      const getKeyPrefix = buildKey(["pages", "get", blogId, pageId])
      store.invalidate((key) => key.startsWith(listPrefix) || key.startsWith(getKeyPrefix))
      return result
    },
  })
}
