import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { ViewType } from "../../types/params"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePostByPathParams {
  readonly view?: ViewType | undefined
  readonly maxComments?: number | undefined
}

export interface UsePostByPathOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

/** Fetches a single Blogger post by path (`blogger.posts.getByPath`). */
export function usePostByPath(
  path: string,
  params: UsePostByPathParams = {},
  options: UsePostByPathOptions = {},
): UseBloggerQueryResult<Post> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId

  return useBloggerQuery({
    store,
    key: resolvedBlogId
      ? buildKey(["posts", "getByPath", resolvedBlogId, path, { ...params }])
      : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePostByPath requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.posts.getByPath({ blogId: resolvedBlogId, path, ...params }, signal)
    },
  })
}
