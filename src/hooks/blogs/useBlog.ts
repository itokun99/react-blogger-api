import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { ViewType } from "../../types/params"
import type { Blog } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseBlogParams {
  readonly view?: ViewType | undefined
  readonly maxPosts?: number | undefined
}

export interface UseBlogOptions {
  readonly blogId?: string | undefined
  readonly enabled?: boolean | undefined
}

/** Fetches a single Blogger blog by id (`blogger.blogs.get`). */
export function useBlog(
  params: UseBlogParams = {},
  options: UseBlogOptions = {},
): UseBloggerQueryResult<Blog> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId

  return useBloggerQuery({
    store,
    key: resolvedBlogId ? buildKey(["blogs", "get", resolvedBlogId, { ...params }]) : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "useBlog requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.blogs.get({ blogId: resolvedBlogId, ...params }, signal)
    },
  })
}
