import { useCallback, useEffect, useState } from "react"
import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { CommentList } from "../../types/lists"
import type { CommentStatus } from "../../types/params"
import type { Comment } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseCommentsByBlogParams {
  readonly status?: readonly CommentStatus[] | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
}

export interface UseCommentsByBlogOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

export interface UseCommentsByBlogResult {
  readonly items: readonly Comment[]
  readonly nextPageToken: string | undefined
  readonly error: Error | undefined
  readonly isLoading: boolean
  readonly isValidating: boolean
  readonly loadMore: () => void
  readonly refetch: () => void
}

/**
 * Lists comments for a blog (`blogger.comments.listByBlog`), accumulating pages
 * into `items` as `loadMore()` is called instead of replacing them.
 */
export function useCommentsByBlog(
  params: UseCommentsByBlogParams = {},
  options: UseCommentsByBlogOptions = {},
): UseCommentsByBlogResult {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)
  const [accumulated, setAccumulated] = useState<readonly Comment[]>([])

  const key = resolvedBlogId
    ? buildKey(["comments", "listByBlog", resolvedBlogId, { ...params, pageToken }])
    : null

  const query = useBloggerQuery<CommentList>({
    store,
    key,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "useCommentsByBlog requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.comments.listByBlog({ blogId: resolvedBlogId, ...params, pageToken }, signal)
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
