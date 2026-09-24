import { describe, expect, test } from "bun:test"
import { z } from "zod"
import { createHttpClient, requestJson, requestVoid } from "../../src/client/request"
import { BloggerApiError, BloggerParseError } from "../../src/types/errors"
import { jsonResponse, mockFetch } from "../helpers/mockFetch"

const EchoSchema = z.object({ ok: z.boolean() })

describe("createHttpClient + requestJson", () => {
  test("parses a successful JSON response through the given schema", async () => {
    const http = createHttpClient({
      fetch: mockFetch(() => jsonResponse({ ok: true })),
    })
    const result = await requestJson(http, "get", "v3/blogs/1", EchoSchema)
    expect(result).toEqual({ ok: true })
  })

  test("adds the apiKey as a `key` search param when no accessToken is configured", async () => {
    const captured: { url: URL | null } = { url: null }
    const http = createHttpClient({
      apiKey: "my-api-key",
      fetch: mockFetch((request) => {
        captured.url = new URL(request.url)
        return jsonResponse({ ok: true })
      }),
    })
    await requestJson(http, "get", "v3/blogs/1", EchoSchema)
    expect(captured.url?.searchParams.get("key")).toBe("my-api-key")
  })

  test("prefers a Bearer accessToken over apiKey for the Authorization header", async () => {
    const captured: { auth: string | null; keyParam: string | null } = {
      auth: null,
      keyParam: null,
    }
    const http = createHttpClient({
      apiKey: "my-api-key",
      accessToken: "token-abc",
      fetch: mockFetch((request) => {
        captured.auth = request.headers.get("authorization")
        captured.keyParam = new URL(request.url).searchParams.get("key")
        return jsonResponse({ ok: true })
      }),
    })
    await requestJson(http, "get", "v3/blogs/1", EchoSchema)
    expect(captured.auth).toBe("Bearer token-abc")
    expect(captured.keyParam).toBeNull()
  })

  test("resolves an async accessToken getter before sending the request", async () => {
    const captured: { auth: string | null } = { auth: null }
    const http = createHttpClient({
      accessToken: async () => "refreshed-token",
      fetch: mockFetch((request) => {
        captured.auth = request.headers.get("authorization")
        return jsonResponse({ ok: true })
      }),
    })
    await requestJson(http, "get", "v3/blogs/1", EchoSchema)
    expect(captured.auth).toBe("Bearer refreshed-token")
  })

  test("throws a BloggerApiError built from Google's error envelope on a non-2xx response", async () => {
    const envelope = {
      error: {
        code: 403,
        message: "User Rate Limit Exceeded",
        errors: [
          {
            domain: "usageLimits",
            reason: "userRateLimitExceeded",
            message: "User Rate Limit Exceeded",
          },
        ],
      },
    }
    const http = createHttpClient({
      fetch: mockFetch(() => jsonResponse(envelope, 403)),
    })
    const failure = requestJson(http, "get", "v3/blogs/1", EchoSchema)
    await expect(failure).rejects.toBeInstanceOf(BloggerApiError)
    await failure.catch((error: BloggerApiError) => {
      expect(error.status).toBe(403)
      expect(error.code).toBe(403)
      expect(error.message).toBe("User Rate Limit Exceeded")
      expect(error.errors[0]?.reason).toBe("userRateLimitExceeded")
    })
  })

  test("falls back to a generic BloggerApiError when the error body doesn't match Google's envelope", async () => {
    const http = createHttpClient({
      fetch: mockFetch(() => new Response("Bad Request", { status: 400 })),
    })
    const failure = requestJson(http, "get", "v3/blogs/1", EchoSchema)
    await expect(failure).rejects.toBeInstanceOf(BloggerApiError)
    await failure.catch((error: BloggerApiError) => {
      expect(error.status).toBe(400)
    })
  })

  test("throws BloggerParseError when the success body fails schema validation", async () => {
    const http = createHttpClient({
      fetch: mockFetch(() => jsonResponse({ ok: "not-a-boolean" })),
    })
    const failure = requestJson(http, "get", "v3/blogs/1", EchoSchema)
    await expect(failure).rejects.toBeInstanceOf(BloggerParseError)
  })
})

describe("requestVoid", () => {
  test("resolves without throwing on an empty-body 204 response", async () => {
    const http = createHttpClient({
      fetch: mockFetch(() => new Response(null, { status: 204 })),
    })
    await expect(requestVoid(http, "delete", "v3/blogs/1/posts/2")).resolves.toBeUndefined()
  })
})
