export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface BloggerClientConfig {
  readonly apiKey?: string | undefined
  readonly accessToken?: string | (() => string | Promise<string>) | undefined
  readonly baseUrl?: string | undefined
  readonly fetch?: FetchLike | undefined
}
