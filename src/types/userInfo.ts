import { z } from "zod"
import { BlogSchema, PostSchema } from "./resources"

export const BlogPerUserInfoSchema = z.object({
  kind: z.string().optional(),
  blogId: z.string().optional(),
  userId: z.string().optional(),
  role: z.enum(["VIEW_TYPE_UNSPECIFIED", "READER", "AUTHOR", "ADMIN"]).optional(),
  hasAdminAccess: z.boolean().optional(),
  photosAlbumKey: z.string().optional(),
})
export type BlogPerUserInfo = z.infer<typeof BlogPerUserInfoSchema>

export const BlogUserInfoSchema = z.object({
  kind: z.string().optional(),
  blog: BlogSchema.optional(),
  blog_user_info: BlogPerUserInfoSchema.optional(),
})
export type BlogUserInfo = z.infer<typeof BlogUserInfoSchema>

export const PostPerUserInfoSchema = z.object({
  kind: z.string().optional(),
  postId: z.string().optional(),
  blogId: z.string().optional(),
  userId: z.string().optional(),
  hasEditAccess: z.boolean().optional(),
})
export type PostPerUserInfo = z.infer<typeof PostPerUserInfoSchema>

export const PostUserInfoSchema = z.object({
  kind: z.string().optional(),
  post: PostSchema.optional(),
  post_user_info: PostPerUserInfoSchema.optional(),
})
export type PostUserInfo = z.infer<typeof PostUserInfoSchema>

export const PostUserInfosListSchema = z.object({
  kind: z.string().optional(),
  nextPageToken: z.string().optional(),
  items: z.array(PostUserInfoSchema).optional(),
})
export type PostUserInfosList = z.infer<typeof PostUserInfosListSchema>
