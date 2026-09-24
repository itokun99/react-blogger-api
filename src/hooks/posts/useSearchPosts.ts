import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { PostList } from "../../types/lists"
import type { OrderBy } from "../../types/params"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseSearchPostsParams {
  readonly fetchBodies?: boolean | undefined
  readonly orderBy?: OrderBy | undefined
}

export interface UseSearchPostsOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

/** Searches Blogger posts (`blogger.posts.search`). */
export function useSearchPosts(
  query: string,
  params: UseSearchPostsParams = {},
  options: UseSearchPostsOptions = {},
): UseBloggerQueryResult<PostList> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId

  return useBloggerQuery({
    store,
    key: resolvedBlogId
      ? buildKey(["posts", "search", resolvedBlogId, query, { ...params }])
      : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "useSearchPosts requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.posts.search({ blogId: resolvedBlogId, q: query, ...params }, signal)
    },
  })
}
