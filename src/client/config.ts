export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type HttpClientType = "ky" | "axios"

export interface BloggerClientConfig {
	readonly apiKey?: string | undefined
	readonly accessToken?: string | (() => string | Promise<string>) | undefined
	readonly baseUrl?: string | undefined
	readonly fetch?: FetchLike | undefined
	readonly httpClient?: HttpClientType | undefined
}
