import { createContext, useContext } from "react"
import type { QueryStore } from "../cache/queryStore"
import type { BloggerClient } from "../client/BloggerClient"
import type { BlogId } from "../types/ids"

export interface BloggerContextValue {
  readonly client: BloggerClient
  readonly store: QueryStore
  readonly defaultBlogId: BlogId | undefined
}

export const BloggerContext = createContext<BloggerContextValue | null>(null)

export function useBlogger(): BloggerContextValue {
  const value = useContext(BloggerContext)
  if (!value) {
    throw new Error("useBlogger must be used within a <BloggerProvider>")
  }
  return value
}
