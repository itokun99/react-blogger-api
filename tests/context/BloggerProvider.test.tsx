import { describe, expect, test } from "bun:test"
import { act, render, screen } from "@testing-library/react"
import { useState } from "react"
import { QueryStore } from "../../src/cache/queryStore"
import { useBlogger } from "../../src/context/BloggerContext"
import { BloggerProvider } from "../../src/context/BloggerProvider"
import { toBlogId } from "../../src/types/ids"

function ThrowsOutsideProvider() {
  useBlogger()
  return null
}

function Consumer({ onRender }: { onRender: (value: ReturnType<typeof useBlogger>) => void }) {
  const value = useBlogger()
  onRender(value)
  return <div data-testid="blog-id">{value.defaultBlogId ?? "none"}</div>
}

describe("useBlogger", () => {
  test("throws when called outside a BloggerProvider", () => {
    const originalError = console.error
    console.error = () => {}
    try {
      expect(() => render(<ThrowsOutsideProvider />)).toThrow(
        "useBlogger must be used within a <BloggerProvider>",
      )
    } finally {
      console.error = originalError
    }
  })
})

describe("BloggerProvider", () => {
  test("supplies client/store/defaultBlogId to descendants", () => {
    const seen: Array<ReturnType<typeof useBlogger>> = []
    render(
      <BloggerProvider config={{ apiKey: "k", defaultBlogId: "blog-1" }}>
        <Consumer onRender={(v) => seen.push(v)} />
      </BloggerProvider>,
    )
    expect(seen[0]?.defaultBlogId).toBe(toBlogId("blog-1"))
    expect(seen[0]?.client.posts).toBeDefined()
    expect(seen[0]?.store).toBeInstanceOf(QueryStore)
    expect(screen.getByTestId("blog-id").textContent).toBe("blog-1")
  })

  test("keeps the same client/store instances across re-renders when config is unchanged", () => {
    const seen: Array<ReturnType<typeof useBlogger>> = []
    function Wrapper() {
      const [, setTick] = useState(0)
      return (
        <BloggerProvider config={{ apiKey: "k" }}>
          <Consumer onRender={(v) => seen.push(v)} />
          <button type="button" onClick={() => setTick((t) => t + 1)}>
            bump
          </button>
        </BloggerProvider>
      )
    }
    render(<Wrapper />)
    const first = seen[0]
    act(() => {
      screen.getByRole("button").click()
    })
    const second = seen.at(-1)
    expect(second?.client).toBe(first?.client)
    expect(second?.store).toBe(first?.store)
  })
})
