import { type ReactNode, useMemo } from "react"
import { QueryClient } from "@tanstack/react-query"
import { QueryStore } from "../cache/queryStore"
import { createBloggerClient } from "../client/BloggerClient"
import type { BloggerClientConfig } from "../client/config"
import { createTanstackQueryAdapter } from "../cache/tanstackQueryAdapter"
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

export interface BloggerTanstackProviderConfig extends BloggerProviderConfig {
	readonly queryClient: QueryClient
}

export interface BloggerTanstackProviderProps {
	readonly config: BloggerTanstackProviderConfig
	readonly children: ReactNode
}

export function BloggerTanstackProvider({ config, children }: BloggerTanstackProviderProps) {
	const { apiKey, accessToken, baseUrl, fetch: fetchImpl, defaultBlogId, queryClient } = config

	const value = useMemo<BloggerContextValue>(
		() => ({
			client: createBloggerClient({ apiKey, accessToken, baseUrl, fetch: fetchImpl }),
			store: createTanstackQueryAdapter({ queryClient }),
			defaultBlogId: defaultBlogId !== undefined ? toBlogId(defaultBlogId) : undefined,
		}),
		[apiKey, accessToken, baseUrl, fetchImpl, defaultBlogId, queryClient],
	)

	return <BloggerContext.Provider value={value}>{children}</BloggerContext.Provider>
}
