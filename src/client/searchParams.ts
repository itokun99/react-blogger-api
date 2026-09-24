export type SearchParamValue = string | number | boolean | undefined
export type SearchParamInput = Record<string, SearchParamValue | readonly SearchParamValue[]>

/**
 * Flattens a params object into `[key, value][]` pairs, expanding array
 * values into one pair per item so repeated query keys survive (Blogger's
 * `status` / `role` / `range` filters are `key=a&key=b`, never comma-joined -
 * a plain object passed straight to `URLSearchParams` would stringify an
 * array as a single "a,b" value instead).
 */
export function buildSearchParams(input: SearchParamInput): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) pairs.push([key, String(item)])
      }
      continue
    }
    pairs.push([key, String(value)])
  }
  return pairs
}
