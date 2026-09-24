import { z } from "zod"

export const VIEW_TYPES = ["VIEW_TYPE_UNSPECIFIED", "READER", "AUTHOR", "ADMIN"] as const
export type ViewType = (typeof VIEW_TYPES)[number]

/** Blogger reuses the `view` enum verbatim for a user's `role` on a blog. */
export type Role = ViewType

export const POST_STATUSES = ["LIVE", "DRAFT", "SCHEDULED", "SOFT_TRASHED"] as const
export type PostStatus = (typeof POST_STATUSES)[number]

export const PAGE_STATUSES = ["LIVE", "DRAFT", "SOFT_TRASHED"] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

export const COMMENT_STATUSES = ["LIVE", "EMPTIED", "PENDING", "SPAM"] as const
export type CommentStatus = (typeof COMMENT_STATUSES)[number]

export const BLOG_STATUSES = ["LIVE", "DELETED"] as const
export type BlogStatus = (typeof BLOG_STATUSES)[number]

export const ORDER_BY_OPTIONS = ["ORDER_BY_UNSPECIFIED", "PUBLISHED", "UPDATED"] as const
export type OrderBy = (typeof ORDER_BY_OPTIONS)[number]

export const SORT_OPTIONS = ["SORT_OPTION_UNSPECIFIED", "DESCENDING", "ASCENDING"] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

/**
 * Distinct from the `Pageviews.counts[].timeRange` response enum
 * (`ALL_TIME` | `THIRTY_DAYS` | `SEVEN_DAYS`) - this is the `range` query
 * parameter accepted by `pageViews.get`, which uses different literals.
 */
export const PAGE_VIEWS_RANGES = ["all", "30DAYS", "7DAYS"] as const
export type PageViewsRange = (typeof PAGE_VIEWS_RANGES)[number]

export const PAGEVIEWS_TIME_RANGES = ["ALL_TIME", "THIRTY_DAYS", "SEVEN_DAYS"] as const
export type PageviewsTimeRange = (typeof PAGEVIEWS_TIME_RANGES)[number]

export const ViewTypeSchema = z.enum(VIEW_TYPES)
export const PostStatusSchema = z.enum(POST_STATUSES)
export const PageStatusSchema = z.enum(PAGE_STATUSES)
export const CommentStatusSchema = z.enum(COMMENT_STATUSES)
export const BlogStatusSchema = z.enum(BLOG_STATUSES)
export const OrderBySchema = z.enum(ORDER_BY_OPTIONS)
export const SortOptionSchema = z.enum(SORT_OPTIONS)
export const PageViewsRangeSchema = z.enum(PAGE_VIEWS_RANGES)
export const PageviewsTimeRangeSchema = z.enum(PAGEVIEWS_TIME_RANGES)
