import { useBlogger } from "../../context/BloggerContext"
import { toUserId } from "../../types/ids"
import type { User } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { type UseBloggerQueryResult, useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseUserOptions {
  readonly enabled?: boolean
}

/** Fetches a Blogger user profile (`blogger.users.get`); defaults to the authenticated user ("self"). */
export function useUser(
  userId = "self",
  options: UseUserOptions = {},
): UseBloggerQueryResult<User> {
  const { client, store } = useBlogger()
  const id = toUserId(userId)

  return useBloggerQuery({
    store,
    key: buildKey(["users", "get", id]),
    enabled: options.enabled,
    fetcher: (signal) => client.users.get({ userId: id }, signal),
  })
}
