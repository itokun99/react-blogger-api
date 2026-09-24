import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toUserId } from "../../types/ids"
import type { BlogUserInfo } from "../../types/userInfo"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseBlogUserInfoOptions {
  readonly blogId?: string | undefined
  readonly userId?: string | undefined
  readonly maxPosts?: number | undefined
  readonly enabled?: boolean | undefined
}

/** Fetches blog user info (`blogger.blogUserInfos.get`). */
export function useBlogUserInfo(
  options: UseBlogUserInfoOptions = {},
): UseBloggerQueryResult<BlogUserInfo> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const resolvedUserId = toUserId(options.userId ?? "self")

  return useBloggerQuery({
    store,
    key: resolvedBlogId
      ? buildKey([
          "blogUserInfos",
          "get",
          resolvedUserId,
          resolvedBlogId,
          { maxPosts: options.maxPosts },
        ])
      : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "useBlogUserInfo requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.blogUserInfos.get(
        { userId: resolvedUserId, blogId: resolvedBlogId, maxPosts: options.maxPosts },
        signal,
      )
    },
  })
}
