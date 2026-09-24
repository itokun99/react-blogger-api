import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId, toUserId } from "../../types/ids"
import type { PostUserInfo } from "../../types/userInfo"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePostUserInfoOptions {
  readonly blogId?: string | undefined
  readonly userId?: string | undefined
  readonly maxComments?: number | undefined
  readonly enabled?: boolean | undefined
}

/** Fetches post user info (`blogger.postUserInfos.get`). */
export function usePostUserInfo(
  postId: string,
  options: UsePostUserInfoOptions = {},
): UseBloggerQueryResult<PostUserInfo> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const resolvedUserId = toUserId(options.userId ?? "self")
  const id = toPostId(postId)

  return useBloggerQuery({
    store,
    key: resolvedBlogId
      ? buildKey([
          "postUserInfos",
          "get",
          resolvedUserId,
          resolvedBlogId,
          id,
          { maxComments: options.maxComments },
        ])
      : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePostUserInfo requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.postUserInfos.get(
        {
          userId: resolvedUserId,
          blogId: resolvedBlogId,
          postId: id,
          maxComments: options.maxComments,
        },
        signal,
      )
    },
  })
}
