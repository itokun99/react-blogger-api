import { useBlogger } from "../../context/BloggerContext"
import { toUserId } from "../../types/ids"
import type { BlogList } from "../../types/lists"
import type { BlogStatus, Role, ViewType } from "../../types/params"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseBlogsByUserParams {
  readonly status?: readonly BlogStatus[] | undefined
  readonly role?: readonly Role[] | undefined
  readonly view?: ViewType | undefined
  readonly fetchUserInfo?: boolean | undefined
}

export interface UseBlogsByUserOptions {
  readonly enabled?: boolean | undefined
}

/** Fetches a list of blogs for a user (`blogger.blogs.listByUser`); defaults userId to "self". */
export function useBlogsByUser(
  userId = "self",
  params: UseBlogsByUserParams = {},
  options: UseBlogsByUserOptions = {},
): UseBloggerQueryResult<BlogList> {
  const { client, store } = useBlogger()
  const resolvedUserId = toUserId(userId)

  return useBloggerQuery({
    store,
    key: buildKey(["blogs", "listByUser", resolvedUserId, { ...params }]),
    enabled: options.enabled,
    fetcher: (signal) => client.blogs.listByUser({ userId: resolvedUserId, ...params }, signal),
  })
}
