import { describe, expect, test } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
// Intentionally import from the BUILT package output, not ../src - this is
// the "does the shipped artifact actually work" proof, exercising exactly
// what an npm consumer would get after `bun run build`.
import { BloggerProvider, type Post, useCreatePost, usePost } from "../dist/index.js"

function mockFetch(handler: (request: Request) => Response | Promise<Response>) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init)
    return handler(request)
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("dist smoke test (built package output)", () => {
  test("usePost (query hook) resolves real data through the built bundle", async () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <BloggerProvider
          config={{
            defaultBlogId: "blog-1",
            fetch: mockFetch(() =>
              jsonResponse({ kind: "blogger#post", id: "post-1", title: "From dist" }),
            ),
          }}
        >
          {children}
        </BloggerProvider>
      )
    }

    const { result } = renderHook(() => usePost("post-1"), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.data?.title).toBe("From dist"))
  })

  test("useCreatePost (mutation hook) posts and resolves through the built bundle", async () => {
    const captured: { method: string | null } = { method: null }
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <BloggerProvider
          config={{
            defaultBlogId: "blog-1",
            fetch: mockFetch((request) => {
              captured.method = request.method
              return jsonResponse({ kind: "blogger#post", id: "post-new", title: "New" })
            }),
          }}
        >
          {children}
        </BloggerProvider>
      )
    }

    const { result } = renderHook(() => useCreatePost(), { wrapper: Wrapper })
    let created: Post | undefined
    await act(async () => {
      created = await result.current.mutateAsync({ post: { title: "New" } })
    })
    expect(captured.method).toBe("POST")
    expect(created?.id).toBe("post-new")
  })
})
