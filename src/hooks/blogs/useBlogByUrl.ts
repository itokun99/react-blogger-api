import { useBlogger } from "../../context/BloggerContext"
import type { ViewType } from "../../types/params"
import type { Blog } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseBlogByUrlParams {
  readonly view?: ViewType | undefined
}

export interface UseBlogByUrlOptions {
  readonly enabled?: boolean | undefined
}

/** Fetches a single Blogger blog by URL (`blogger.blogs.getByUrl`). */
export function useBlogByUrl(
  url: string,
  params: UseBlogByUrlParams = {},
  options: UseBlogByUrlOptions = {},
): UseBloggerQueryResult<Blog> {
  const { client, store } = useBlogger()

  return useBloggerQuery({
    store,
    key: buildKey(["blogs", "getByUrl", url, { ...params }]),
    enabled: options.enabled,
    fetcher: (signal) => client.blogs.getByUrl({ url, ...params }, signal),
  })
}
