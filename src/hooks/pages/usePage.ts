import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPageId } from "../../types/ids"
import type { ViewType } from "../../types/params"
import type { Page } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePageParams {
  readonly view?: ViewType
}

export interface UsePageOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

/** Fetches a single Blogger page by id (`blogger.pages.get`). */
export function usePage(
  pageId: string,
  params: UsePageParams = {},
  options: UsePageOptions = {},
): UseBloggerQueryResult<Page> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const id = toPageId(pageId)

  return useBloggerQuery({
    store,
    key: resolvedBlogId ? buildKey(["pages", "get", resolvedBlogId, id, { ...params }]) : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePage requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.pages.get({ blogId: resolvedBlogId, pageId: id, ...params }, signal)
    },
  })
}
