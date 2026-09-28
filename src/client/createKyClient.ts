import ky, { HTTPError, type KyInstance, SchemaValidationError } from "ky"
import { BloggerApiError, BloggerParseError } from "../types/errors"
import type { BloggerClientConfig } from "./config"
import type { HttpClient, HttpClientRequestOptions } from "./httpClient"
import { buildSearchParams } from "./searchParams"

const DEFAULT_BASE_URL = "https://blogger.googleapis.com/"

function toBloggerError(error: unknown): never {
	if (error instanceof HTTPError) {
		throw BloggerApiError.fromResponseBody(error.response.status, error.data, error)
	}
	if (error instanceof SchemaValidationError) {
		throw new BloggerParseError("Blogger API response failed schema validation", { cause: error })
	}
	throw error
}

export function createKyClient(config: BloggerClientConfig): HttpClient {
	const http = ky.create({
		baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
		...(config.fetch ? { fetch: config.fetch } : {}),
		hooks: {
			beforeRequest: [
				async ({ request }) => {
					const token =
						typeof config.accessToken === "function"
							? await config.accessToken()
							: config.accessToken
					if (token) {
						request.headers.set("Authorization", `Bearer ${token}`)
						return undefined
					}
					if (config.apiKey) {
						const url = new URL(request.url)
						url.searchParams.set("key", config.apiKey)
						return new Request(url, request)
					}
					return undefined
				},
			],
		},
	})

	return {
		async get<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const result = await http.get(path, {
					searchParams: options?.searchParams ? buildSearchParams(options.searchParams) : undefined,
					json: options?.json,
					signal: options?.signal,
				} as any)
				return result.json() as Promise<T>
			} catch (error) {
				return toBloggerError(error)
			}
		},
		async post<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const result = await http.post(path, {
					searchParams: options?.searchParams ? buildSearchParams(options.searchParams) : undefined,
					json: options?.json,
					signal: options?.signal,
				} as any)
				return result.json() as Promise<T>
			} catch (error) {
				return toBloggerError(error)
			}
		},
		async put<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const result = await http.put(path, {
					searchParams: options?.searchParams ? buildSearchParams(options.searchParams) : undefined,
					json: options?.json,
					signal: options?.signal,
				} as any)
				return result.json() as Promise<T>
			} catch (error) {
				return toBloggerError(error)
			}
		},
		async patch<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const result = await http.patch(path, {
					searchParams: options?.searchParams ? buildSearchParams(options.searchParams) : undefined,
					json: options?.json,
					signal: options?.signal,
				} as any)
				return result.json() as Promise<T>
			} catch (error) {
				return toBloggerError(error)
			}
		},
		async delete(path: string, options?: HttpClientRequestOptions): Promise<void> {
			try {
				await http.delete(path, {
					searchParams: options?.searchParams ? buildSearchParams(options.searchParams) : undefined,
					json: options?.json,
					signal: options?.signal,
				} as any)
			} catch (error) {
				return toBloggerError(error)
			}
		},
	}
}
