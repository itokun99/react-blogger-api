import { z } from "zod"

/**
 * Response-schema id fields are plain `z.string()`, NOT the branded
 * `BlogId`/`PostId`/etc from `./ids` - branding only guards values a hook
 * constructs internally (client method params); data arriving FROM the API
 * flows through as plain strings so equality checks (`expect(post.id).toBe("x")`)
 * and any future consumer code stay ergonomic. See `.omo/plans/react-blogger-api.md`.
 */
const AuthorSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().optional(),
  url: z.string().optional(),
  image: z.object({ url: z.string().optional() }).optional(),
})

const BlogRefSchema = z.object({ id: z.string().optional() })
const PostRefSchema = z.object({ id: z.string().optional() })
const CommentRefSchema = z.object({ id: z.string().optional() })

const LocaleSchema = z.object({
  language: z.string().optional(),
  variant: z.string().optional(),
  country: z.string().optional(),
})

export const CommentSchema = z.object({
  kind: z.string().optional(),
  id: z.string().optional(),
  selfLink: z.string().optional(),
  blog: BlogRefSchema.optional(),
  post: PostRefSchema.optional(),
  inReplyTo: CommentRefSchema.optional(),
  content: z.string().optional(),
  author: AuthorSchema.optional(),
  status: z.enum(["LIVE", "EMPTIED", "PENDING", "SPAM"]).optional(),
  published: z.string().optional(),
  updated: z.string().optional(),
})
export type Comment = z.infer<typeof CommentSchema>

export const PostSchema = z.object({
  kind: z.string().optional(),
  id: z.string().optional(),
  selfLink: z.string().optional(),
  url: z.string().optional(),
  titleLink: z.string().optional(),
  blog: BlogRefSchema.optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  author: AuthorSchema.optional(),
  replies: z
    .object({
      totalItems: z.string().optional(),
      selfLink: z.string().optional(),
      items: z.array(CommentSchema).optional(),
    })
    .optional(),
  labels: z.array(z.string()).optional(),
  images: z.array(z.object({ url: z.string().optional() })).optional(),
  location: z
    .object({
      name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      span: z.string().optional(),
    })
    .optional(),
  status: z.enum(["LIVE", "DRAFT", "SCHEDULED", "SOFT_TRASHED"]).optional(),
  readerComments: z
    .enum(["ALLOW", "DONT_ALLOW_SHOW_EXISTING", "DONT_ALLOW_HIDE_EXISTING"])
    .optional(),
  customMetaData: z.string().optional(),
  published: z.string().optional(),
  updated: z.string().optional(),
  trashed: z.string().optional(),
  etag: z.string().optional(),
})
export type Post = z.infer<typeof PostSchema>

export const PageSchema = z.object({
  kind: z.string().optional(),
  id: z.string().optional(),
  selfLink: z.string().optional(),
  url: z.string().optional(),
  blog: BlogRefSchema.optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  author: AuthorSchema.optional(),
  status: z.enum(["LIVE", "DRAFT", "SOFT_TRASHED"]).optional(),
  published: z.string().optional(),
  updated: z.string().optional(),
  trashed: z.string().optional(),
  etag: z.string().optional(),
})
export type Page = z.infer<typeof PageSchema>

export const BlogSchema = z.object({
  kind: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  selfLink: z.string().optional(),
  locale: LocaleSchema.optional(),
  posts: z
    .object({
      totalItems: z.number().optional(),
      selfLink: z.string().optional(),
      items: z.array(PostSchema).optional(),
    })
    .optional(),
  pages: z
    .object({
      totalItems: z.number().optional(),
      selfLink: z.string().optional(),
    })
    .optional(),
  status: z.enum(["LIVE", "DELETED"]).optional(),
  customMetaData: z.string().optional(),
  published: z.string().optional(),
  updated: z.string().optional(),
})
export type Blog = z.infer<typeof BlogSchema>

export const UserSchema = z.object({
  kind: z.string().optional(),
  id: z.string().optional(),
  displayName: z.string().optional(),
  about: z.string().optional(),
  url: z.string().optional(),
  selfLink: z.string().optional(),
  blogs: z.object({ selfLink: z.string().optional() }).optional(),
  locale: LocaleSchema.optional(),
  created: z.string().optional(),
})
export type User = z.infer<typeof UserSchema>

export const PageviewsSchema = z.object({
  kind: z.string().optional(),
  blogId: z.string().optional(),
  counts: z
    .array(
      z.object({
        timeRange: z.enum(["ALL_TIME", "THIRTY_DAYS", "SEVEN_DAYS"]).optional(),
        count: z.string().optional(),
      }),
    )
    .optional(),
})
export type Pageviews = z.infer<typeof PageviewsSchema>

export { AuthorSchema, BlogRefSchema, CommentRefSchema, LocaleSchema, PostRefSchema }
