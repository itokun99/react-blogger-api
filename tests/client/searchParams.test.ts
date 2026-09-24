import { describe, expect, test } from "bun:test"
import { buildSearchParams } from "../../src/client/searchParams"

describe("buildSearchParams", () => {
  test("converts scalar values to string pairs", () => {
    expect(buildSearchParams({ blogId: "1", maxResults: 5, fetchBodies: true })).toEqual([
      ["blogId", "1"],
      ["maxResults", "5"],
      ["fetchBodies", "true"],
    ])
  })

  test("expands array values into one pair per item, preserving the repeated key", () => {
    expect(buildSearchParams({ status: ["LIVE", "DRAFT"] })).toEqual([
      ["status", "LIVE"],
      ["status", "DRAFT"],
    ])
  })

  test("omits keys whose value is undefined, including undefined items inside arrays", () => {
    expect(buildSearchParams({ view: undefined, status: ["LIVE", undefined, "SPAM"] })).toEqual([
      ["status", "LIVE"],
      ["status", "SPAM"],
    ])
  })

  test("returns an empty array for an empty input", () => {
    expect(buildSearchParams({})).toEqual([])
  })
})
