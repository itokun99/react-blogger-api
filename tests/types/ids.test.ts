import { describe, expect, test } from "bun:test"
import { toBlogId, toCommentId, toPageId, toPostId, toUserId } from "../../src/types/ids"

describe("branded id smart constructors", () => {
  test("toBlogId returns the input value branded as BlogId when non-empty", () => {
    const id = toBlogId("1234567890")
    expect(id).toBe(toBlogId("1234567890"))
  })

  test("toBlogId throws when given an empty string", () => {
    expect(() => toBlogId("")).toThrow()
  })

  test("toPostId, toPageId, toCommentId, toUserId all accept non-empty strings", () => {
    expect(toPostId("p1")).toBe(toPostId("p1"))
    expect(toPageId("pg1")).toBe(toPageId("pg1"))
    expect(toCommentId("c1")).toBe(toCommentId("c1"))
    expect(toUserId("u1")).toBe(toUserId("u1"))
  })

  test("toPostId throws when given an empty string", () => {
    expect(() => toPostId("")).toThrow()
  })
})
