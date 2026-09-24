import { z } from "zod"
import { BlogSchema, CommentSchema, PageSchema, PostSchema } from "./resources"
import { BlogUserInfoSchema } from "./userInfo"

export const BlogListSchema = z.object({
  kind: z.string().optional(),
  items: z.array(BlogSchema).optional(),
  blogUserInfos: z.array(BlogUserInfoSchema).optional(),
})
export type BlogList = z.infer<typeof BlogListSchema>

export const PostListSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  items: z.array(PostSchema).optional(),
})
export type PostList = z.infer<typeof PostListSchema>

export const PageListSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  items: z.array(PageSchema).optional(),
})
export type PageList = z.infer<typeof PageListSchema>

export const CommentListSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  items: z.array(CommentSchema).optional(),
})
export type CommentList = z.infer<typeof CommentListSchema>
