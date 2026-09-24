import { z } from "zod"

const BlogIdSchema = z.string().min(1).brand("BlogId")
const PostIdSchema = z.string().min(1).brand("PostId")
const PageIdSchema = z.string().min(1).brand("PageId")
const CommentIdSchema = z.string().min(1).brand("CommentId")
const UserIdSchema = z.string().min(1).brand("UserId")

export type BlogId = z.infer<typeof BlogIdSchema>
export type PostId = z.infer<typeof PostIdSchema>
export type PageId = z.infer<typeof PageIdSchema>
export type CommentId = z.infer<typeof CommentIdSchema>
export type UserId = z.infer<typeof UserIdSchema>

/** Parse a raw string into a {@link BlogId} at the boundary. Throws `ZodError` when empty. */
export function toBlogId(value: string): BlogId {
  return BlogIdSchema.parse(value)
}

/** Parse a raw string into a {@link PostId} at the boundary. Throws `ZodError` when empty. */
export function toPostId(value: string): PostId {
  return PostIdSchema.parse(value)
}

/** Parse a raw string into a {@link PageId} at the boundary. Throws `ZodError` when empty. */
export function toPageId(value: string): PageId {
  return PageIdSchema.parse(value)
}

/** Parse a raw string into a {@link CommentId} at the boundary. Throws `ZodError` when empty. */
export function toCommentId(value: string): CommentId {
  return CommentIdSchema.parse(value)
}

/** Parse a raw string into a {@link UserId} at the boundary. Throws `ZodError` when empty. */
export function toUserId(value: string): UserId {
  return UserIdSchema.parse(value)
}

export { BlogIdSchema, CommentIdSchema, PageIdSchema, PostIdSchema, UserIdSchema }
