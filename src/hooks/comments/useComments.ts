import { useCallback, useEffect, useState } from "react"
import { useBlogger } from "../../context/BloggerContext"
import { toBlogId, toPostId } from "../../types/ids"
import type { CommentList } from "../../types/lists"
import type { CommentStatus, ViewType } from "../../types/params"
import type { Comment } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { useBloggerQuery } from "../internal/useBloggerQuery"

export interface UseCommentsParams {
  readonly status?: CommentStatus | undefined
  readonly view?: ViewType | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
}

export interface UseCommentsOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

export interface UseCommentsResult {
  readonly items: readonly Comment[]
  readonly nextPageToken: string | undefined
  readonly error: Error | undefined
  readonly isLoading: boolean
  readonly isValidating: boolean
  readonly loadMore: () => void
  readonly refetch: () => void
}

/**
 * Lists comments for a post (`blogger.comments.list`), accumulating pages into
 * `items` as `loadMore()` is called instead of replacing them.
 */
export function useComments(
  postId: string,
  params: UseCommentsParams = {},
  options: UseCommentsOptions = {},
): UseCommentsResult {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const brandedPostId = toPostId(postId)
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)
  const [accumulated, setAccumulated] = useState<readonly Comment[]>([])

  const key = resolvedBlogId
    ? buildKey(["comments", "list", resolvedBlogId, brandedPostId, { ...params, pageToken }])
    : null

  const query = useBloggerQuery<CommentList>({
    store,
    key,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "useComments requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.comments.list(
        { blogId: resolvedBlogId, postId: brandedPostId, ...params, pageToken },
        signal,
      )
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: only new pages should append, not resolvedBlogId/postId/pageToken changes
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
