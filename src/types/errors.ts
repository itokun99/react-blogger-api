import { z } from "zod"

const BloggerApiErrorDetailSchema = z.object({
  domain: z.string(),
  reason: z.string(),
  message: z.string(),
})

const BloggerErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    errors: z.array(BloggerApiErrorDetailSchema).default([]),
  }),
})

export type BloggerApiErrorDetail = z.infer<typeof BloggerApiErrorDetailSchema>

export class BloggerApiError extends Error {
  readonly name = "BloggerApiError"
  readonly status: number
  readonly code: number | undefined
  readonly errors: readonly BloggerApiErrorDetail[]

  private constructor(
    message: string,
    status: number,
    code: number | undefined,
    errors: readonly BloggerApiErrorDetail[],
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.status = status
    this.code = code
    this.errors = errors
  }

  static fromResponseBody(status: number, body: unknown, cause?: unknown): BloggerApiError {
    const parsed = BloggerErrorEnvelopeSchema.safeParse(body)
    if (parsed.success) {
      const { code, message, errors } = parsed.data.error
      return new BloggerApiError(message, status, code, errors, { cause })
    }
    return new BloggerApiError(
      `Blogger API request failed with status ${status}`,
      status,
      undefined,
      [],
      { cause },
    )
  }
}

export class BloggerParseError extends Error {
  readonly name = "BloggerParseError"

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
  }
}
