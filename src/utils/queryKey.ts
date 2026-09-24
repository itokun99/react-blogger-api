export type QueryKeyPart = string | number | boolean | undefined | Readonly<Record<string, unknown>>

export function buildKey(parts: readonly QueryKeyPart[]): string {
  return parts
    .filter((part): part is Exclude<QueryKeyPart, undefined> => part !== undefined)
    .map((part) => (typeof part === "object" ? JSON.stringify(part) : String(part)))
    .join(":")
}
