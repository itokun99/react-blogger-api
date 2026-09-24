import ky, { HTTPError, type KyInstance, SchemaValidationError } from "ky"
import type { z } from "zod"
import { BloggerApiError, BloggerParseError } from "../types/errors"
import type { BloggerClientConfig } from "./config"
import { buildSearchParams, type SearchParamInput } from "./searchParams"

const DEFAULT_BASE_URL = "https://blogger.googleapis.com/"

export function createHttpClient(config: BloggerClientConfig): KyInstance {
  return ky.create({
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
}

export interface RequestOptions {
  readonly searchParams?: SearchParamInput | undefined
  readonly json?: unknown
  readonly signal?: AbortSignal | undefined
}

async function toBloggerError(error: unknown): Promise<never> {
  if (error instanceof HTTPError) {
    throw BloggerApiError.fromResponseBody(error.response.status, error.data, error)
  }
  if (error instanceof SchemaValidationError) {
    throw new BloggerParseError("Blogger API response failed schema validation", { cause: error })
  }
  throw error
}

export async function requestJson<T>(
  http: KyInstance,
  method: "get" | "post" | "put" | "patch",
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await http[method](path, {
      searchParams: options.searchParams ? buildSearchParams(options.searchParams) : undefined,
      json: options.json,
      ...(options.signal ? { signal: options.signal } : {}),
    }).json(schema)
  } catch (error) {
    return toBloggerError(error)
  }
}

export async function requestVoid(
  http: KyInstance,
  method: "delete",
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  try {
    await http[method](path, {
      searchParams: options.searchParams ? buildSearchParams(options.searchParams) : undefined,
      ...(options.signal ? { signal: options.signal } : {}),
    })
  } catch (error) {
    return toBloggerError(error)
  }
}
