import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId } from "../../types/ids"
import type { ViewType } from "../../types/params"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePostParams {
  readonly view?: ViewType
  readonly fetchBody?: boolean
  readonly fetchImages?: boolean
  readonly maxComments?: number
}

export interface UsePostOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

/** Fetches a single Blogger post by id (`blogger.posts.get`). */
export function usePost(
  postId: string,
  params: UsePostParams = {},
  options: UsePostOptions = {},
): UseBloggerQueryResult<Post> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const id = toPostId(postId)

  return useBloggerQuery({
    store,
    key: resolvedBlogId ? buildKey(["posts", "get", resolvedBlogId, id, { ...params }]) : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePost requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.posts.get({ blogId: resolvedBlogId, postId: id, ...params }, signal)
    },
  })
}
