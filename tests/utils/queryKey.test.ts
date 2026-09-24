import { describe, expect, test } from "bun:test"
import { buildKey } from "../../src/utils/queryKey"

describe("buildKey", () => {
  test("joins scalar parts with a colon", () => {
    expect(buildKey(["posts", "get", "blog-1", "post-1"])).toBe("posts:get:blog-1:post-1")
  })

  test("serializes an object part as JSON", () => {
    expect(buildKey(["posts", "list", "blog-1", { maxResults: 10 }])).toBe(
      'posts:list:blog-1:{"maxResults":10}',
    )
  })

  test("skips undefined parts", () => {
    expect(buildKey(["posts", undefined, "get"])).toBe("posts:get")
  })
})
