import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { PageViewsRange } from "../../types/params"
import type { Pageviews } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePageViewsParams {
  readonly range?: readonly PageViewsRange[] | undefined
}

export interface UsePageViewsOptions {
  readonly blogId?: string | undefined
  readonly enabled?: boolean | undefined
}

/** Fetches page view statistics for a blog (`blogger.pageViews.get`). */
export function usePageViews(
  params: UsePageViewsParams = {},
  options: UsePageViewsOptions = {},
): UseBloggerQueryResult<Pageviews> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId

  return useBloggerQuery({
    store,
    key: resolvedBlogId ? buildKey(["pageViews", "get", resolvedBlogId, { ...params }]) : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePageViews requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.pageViews.get({ blogId: resolvedBlogId, ...params }, signal)
    },
  })
}
