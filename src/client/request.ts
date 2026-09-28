import type { z } from "zod"
import { BloggerApiError, BloggerParseError } from "../types/errors"
import type { BloggerClientConfig } from "./config"
import type { HttpClient, HttpClientRequestOptions } from "./httpClient"
import { buildSearchParams } from "./searchParams"
import { createKyClient } from "./createKyClient"

const DEFAULT_BASE_URL = "https://blogger.googleapis.com/"

function toBloggerError(error: unknown): never {
	if (error instanceof Error && "status" in error) {
		const e = error as any
		throw BloggerApiError.fromResponseBody(e.response?.status, e.data, e)
	}
	if (error instanceof Error && error.name === "ZodError") {
		throw new BloggerParseError("Blogger API response failed schema validation", { cause: error })
	}
	throw error
}

export async function requestJson<T>(
	http: HttpClient,
	method: "get" | "post" | "put" | "patch",
	path: string,
	schema: z.ZodType<T>,
	options: HttpClientRequestOptions = {},
): Promise<T> {
	try {
		const result = await http[method](path, options)
		return schema.parse(result) as T
	} catch (error) {
		if (error instanceof BloggerApiError || error instanceof BloggerParseError) {
			throw error
		}
		return toBloggerError(error)
	}
}

export async function requestVoid(
	http: HttpClient,
	method: "delete",
	path: string,
	options: HttpClientRequestOptions = {},
): Promise<void> {
	try {
		await http.delete(path, options)
	} catch (error) {
		if (error instanceof BloggerApiError) {
			throw error
		}
		return toBloggerError(error)
	}
}

/** @deprecated Use {@link createKyClient} instead */
export function createHttpClient(config: BloggerClientConfig): HttpClient {
	return createKyClient(config)
}

export { createKyClient } from "./createKyClient"
