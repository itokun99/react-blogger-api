import type { FetchLike } from "../../src/client/config"

export function mockFetch(handler: (request: Request) => Response | Promise<Response>): FetchLike {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init)
    return handler(request)
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}
