import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { Page } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerMutationResult, useBloggerMutation } from "../internal/useBloggerMutation"

export interface CreatePageArgs {
  readonly blogId?: string
  readonly page: Page
  readonly isDraft?: boolean
}

/** Creates a new Blogger page (`blogger.pages.insert`); invalidates cached lists for its blog. */
export function useCreatePage(): UseBloggerMutationResult<CreatePageArgs, Page> {
  const { client, store, defaultBlogId } = useBlogger()

  return useBloggerMutation({
    mutationFn: async (args: CreatePageArgs) => {
      const blogId = args.blogId !== undefined ? toBlogId(args.blogId) : defaultBlogId
      if (!blogId) {
        throw new Error(
          "useCreatePage requires a blogId - pass args.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      const result = await client.pages.insert({ blogId, isDraft: args.isDraft }, args.page)
      const listPrefix = buildKey(["pages", "list", blogId])
      store.invalidate((key) => key.startsWith(listPrefix))
      return result
    },
  })
}
