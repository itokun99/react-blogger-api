import { describe, expect, test } from "bun:test"
import { createAxiosClient } from "../../src/client/createAxiosClient"

describe("createAxiosClient", () => {
	test("creates an HttpClient instance", () => {
		const client = createAxiosClient({})
		expect(client).toBeDefined()
		expect(typeof client.get).toBe("function")
		expect(typeof client.post).toBe("function")
		expect(typeof client.put).toBe("function")
		expect(typeof client.patch).toBe("function")
		expect(typeof client.delete).toBe("function")
	})
})
