import { describe, expect, test } from "bun:test"
import { QueryClient } from "@tanstack/react-query"
import { createTanstackQueryAdapter } from "../../src/cache/tanstackQueryAdapter"
import type { QueryStore } from "../../src/cache/queryStore"

describe("createTanstackQueryAdapter", () => {
	test("creates a QueryStore adapter", () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 0 } } })
		const adapter = createTanstackQueryAdapter({ queryClient })
		expect(adapter).toBeDefined()
		expect(typeof adapter.getSnapshot).toBe("function")
		expect(typeof adapter.subscribe).toBe("function")
		expect(typeof adapter.fetchOnce).toBe("function")
		expect(typeof adapter.invalidate).toBe("function")
		expect(typeof adapter.cancel).toBe("function")
	})

	test("getSnapshot returns IDLE_ENTRY for non-existent query", () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 0 } } })
		const adapter = createTanstackQueryAdapter({ queryClient })
		const snapshot = adapter.getSnapshot("non-existent-key")

		expect(snapshot.data).toBeUndefined()
		expect(snapshot.error).toBeUndefined()
		expect(snapshot.isFetching).toBe(false)
		expect(snapshot.epoch).toBe(0)
	})

	test("fetchOnce fetches and stores data", async () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 0 } } })
		const adapter = createTanstackQueryAdapter({ queryClient })

		const result = await adapter.fetchOnce("test-key", async () => ({ data: "hello" }))
		expect(result).toEqual({ data: "hello" })
	})

	test("invalidate bumps epoch for matching keys", async () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 0 } } })
		const adapter = createTanstackQueryAdapter({ queryClient })

		await adapter.fetchOnce("blog-1", async () => ({ id: "blog-1" }))
		const epochBefore = adapter.getSnapshot("blog-1").epoch

		adapter.invalidate((key: string) => key.startsWith("blog"))
		const epochAfter = adapter.getSnapshot("blog-1").epoch

		expect(epochAfter).toBeGreaterThan(epochBefore)
	})
})
