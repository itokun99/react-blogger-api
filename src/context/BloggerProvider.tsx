import { type ReactNode, useMemo } from "react"
import { QueryStore } from "../cache/queryStore"
import { createBloggerClient } from "../client/BloggerClient"
import type { BloggerClientConfig } from "../client/config"
import { toBlogId } from "../types/ids"
import { BloggerContext, type BloggerContextValue } from "./BloggerContext"

export interface BloggerProviderConfig extends BloggerClientConfig {
  readonly defaultBlogId?: string
}

export interface BloggerProviderProps {
  readonly config: BloggerProviderConfig
  readonly children: ReactNode
}

export function BloggerProvider({ config, children }: BloggerProviderProps) {
  const { apiKey, accessToken, baseUrl, fetch: fetchImpl, defaultBlogId } = config

  const value = useMemo<BloggerContextValue>(
    () => ({
      client: createBloggerClient({ apiKey, accessToken, baseUrl, fetch: fetchImpl }),
      store: new QueryStore(),
      defaultBlogId: defaultBlogId !== undefined ? toBlogId(defaultBlogId) : undefined,
    }),
    [apiKey, accessToken, baseUrl, fetchImpl, defaultBlogId],
  )

  return <BloggerContext.Provider value={value}>{children}</BloggerContext.Provider>
}
