import { useCallback, useEffect, useState } from "react"
import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { PageList } from "../../types/lists"
import type { PageStatus, ViewType } from "../../types/params"
import type { Page } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePagesParams {
  readonly status?: readonly PageStatus[] | undefined
  readonly view?: ViewType | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
}

export interface UsePagesOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

export interface UsePagesResult {
  readonly items: readonly Page[]
  readonly nextPageToken: string | undefined
  readonly error: Error | undefined
  readonly isLoading: boolean
  readonly isValidating: boolean
  readonly loadMore: () => void
  readonly refetch: () => void
}

/** Lists pages for a blog (`blogger.pages.list`), accumulating pages into `items` as `loadMore()` is called. */
export function usePages(
  params: UsePagesParams = {},
  options: UsePagesOptions = {},
): UsePagesResult {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)
  const [accumulated, setAccumulated] = useState<readonly Page[]>([])

  const key = resolvedBlogId
    ? buildKey(["pages", "list", resolvedBlogId, { ...params, pageToken }])
    : null

  const query = useBloggerQuery<PageList>({
    store,
    key,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePages requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.pages.list({ blogId: resolvedBlogId, ...params, pageToken }, signal)
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: only new pages should append, not resolvedBlogId/pageToken changes
  useEffect(() => {
    if (!query.data) return
    setAccumulated((previous) =>
      pageToken ? [...previous, ...(query.data?.items ?? [])] : (query.data?.items ?? []),
    )
  }, [query.data])

  const loadMore = useCallback(() => {
    const next = query.data?.nextPageToken
    if (next) setPageToken(next)
  }, [query.data])

  const queryRefetch = query.refetch
  const refetch = useCallback(() => {
    setPageToken(undefined)
    setAccumulated([])
    void queryRefetch()
  }, [queryRefetch])

  return {
    items: accumulated,
    nextPageToken: query.data?.nextPageToken,
    error: query.error,
    isLoading: query.isLoading,
    isValidating: query.isValidating,
    loadMore,
    refetch,
  }
}
