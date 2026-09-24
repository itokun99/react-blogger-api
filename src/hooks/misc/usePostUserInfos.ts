import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toUserId } from "../../types/ids"
import type { OrderBy, PostStatus, ViewType } from "../../types/params"
import type { PostUserInfosList } from "../../types/userInfo"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePostUserInfosParams {
  readonly status?: readonly PostStatus[] | undefined
  readonly labels?: string | undefined
  readonly view?: ViewType | undefined
  readonly orderBy?: OrderBy | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly pageToken?: string | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
}

export interface UsePostUserInfosOptions {
  readonly blogId?: string | undefined
  readonly userId?: string | undefined
  readonly enabled?: boolean | undefined
}

/** Fetches a list of post user infos for a blog (`blogger.postUserInfos.list`). */
export function usePostUserInfos(
  params: UsePostUserInfosParams = {},
  options: UsePostUserInfosOptions = {},
): UseBloggerQueryResult<PostUserInfosList> {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const resolvedUserId = toUserId(options.userId ?? "self")

  return useBloggerQuery({
    store,
    key: resolvedBlogId
      ? buildKey(["postUserInfos", "list", resolvedUserId, resolvedBlogId, { ...params }])
      : null,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePostUserInfos requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.postUserInfos.list(
        { userId: resolvedUserId, blogId: resolvedBlogId, ...params },
        signal,
      )
    },
  })
}
