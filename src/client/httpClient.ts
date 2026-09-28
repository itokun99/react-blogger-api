import type { SearchParamInput } from "./searchParams"

export interface HttpClientRequestOptions {
	readonly searchParams?: SearchParamInput | undefined
	readonly json?: unknown
	readonly signal?: AbortSignal | undefined
}

export interface HttpClient {
	get<T>(path: string, options?: HttpClientRequestOptions): Promise<T>
	post<T>(path: string, options?: HttpClientRequestOptions): Promise<T>
	put<T>(path: string, options?: HttpClientRequestOptions): Promise<T>
	patch<T>(path: string, options?: HttpClientRequestOptions): Promise<T>
	delete(path: string, options?: HttpClientRequestOptions): Promise<void>
}
