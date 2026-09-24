import { useCallback, useEffect, useState } from "react"
import { useBlogger } from "../../context/BloggerContext"
import { toBlogId } from "../../types/ids"
import type { PostList } from "../../types/lists"
import type { OrderBy, PostStatus, SortOption, ViewType } from "../../types/params"
import type { Post } from "../../types/resources"
import { buildKey } from "../../utils/queryKey"
import { useBloggerQuery } from "../internal/useBloggerQuery"

export interface UsePostsParams {
  readonly status?: readonly PostStatus[] | undefined
  readonly view?: ViewType | undefined
  readonly orderBy?: OrderBy | undefined
  readonly sortOption?: SortOption | undefined
  readonly startDate?: string | undefined
  readonly endDate?: string | undefined
  readonly labels?: string | undefined
  readonly maxResults?: number | undefined
  readonly fetchBodies?: boolean | undefined
  readonly fetchImages?: boolean | undefined
}

export interface UsePostsOptions {
  readonly blogId?: string
  readonly enabled?: boolean
}

export interface UsePostsResult {
  readonly items: readonly Post[]
  readonly nextPageToken: string | undefined
  readonly error: Error | undefined
  readonly isLoading: boolean
  readonly isValidating: boolean
  readonly loadMore: () => void
  readonly refetch: () => void
}

/**
 * Lists posts for a blog (`blogger.posts.list`), accumulating pages into
 * `items` as `loadMore()` is called instead of replacing them - this is the
 * canonical pagination template `usePages`/`useComments` mirror: each
 * `pageToken` gets its own cache entry (via the key), while accumulation
 * across pages is local component state layered on top.
 */
export function usePosts(
  params: UsePostsParams = {},
  options: UsePostsOptions = {},
): UsePostsResult {
  const { client, store, defaultBlogId } = useBlogger()
  const resolvedBlogId = options.blogId !== undefined ? toBlogId(options.blogId) : defaultBlogId
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)
  const [accumulated, setAccumulated] = useState<readonly Post[]>([])

  const key = resolvedBlogId
    ? buildKey(["posts", "list", resolvedBlogId, { ...params, pageToken }])
    : null

  const query = useBloggerQuery<PostList>({
    store,
    key,
    enabled: options.enabled,
    fetcher: (signal) => {
      if (!resolvedBlogId) {
        throw new Error(
          "usePosts requires a blogId - pass options.blogId or set BloggerProvider's defaultBlogId",
        )
      }
      return client.posts.list({ blogId: resolvedBlogId, ...params, pageToken }, signal)
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
