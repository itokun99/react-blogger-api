import type { ReactNode } from "react"
import { BloggerProvider, type BloggerProviderConfig } from "../../src/context/BloggerProvider"
import { jsonResponse, mockFetch } from "./mockFetch"

export function providerWrapper(
  handler: (request: Request) => Response | Promise<Response>,
  config: Omit<BloggerProviderConfig, "fetch"> = {},
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BloggerProvider config={{ ...config, fetch: mockFetch(handler) }}>
        {children}
      </BloggerProvider>
    )
  }
}

export function jsonHandler(body: unknown, status = 200): (request: Request) => Response {
  return () => jsonResponse(body, status)
}
