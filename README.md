# react-blogger-api

[![npm version](https://img.shields.io/npm/v/react-blogger-api.svg)](https://www.npmjs.com/package/react-blogger-api)
[![npm downloads](https://img.shields.io/npm/dm/react-blogger-api.svg)](https://www.npmjs.com/package/react-blogger-api)
[![license](https://img.shields.io/npm/l/react-blogger-api.svg)](./LICENSE)

Fully-typed React hooks and a Context provider for Google's [Blogger API v3](https://developers.google.com/blogger/docs/3.0/getting_started).

Written in TypeScript under `strict` + `exactOptionalPropertyTypes`, with Zod-validated responses at the network boundary and a small built-in query cache. Zero config required beyond an API key.

- **33 hooks** — one per documented Blogger API v3 method, plus `useBlogger` for direct client access
- **Typed end to end** — every method has typed params and a Zod-validated response type
- **Cache with invalidation** — mutations automatically invalidate the queries they affect
- **Fetch-free tests** — inject a `fetch` implementation; every hook is fully testable offline
- **Small footprint** — 56 KB ESM bundle; `react`, `ky`, and `zod` stay external

## Install

```sh
bun add react-blogger-api
# or: npm install react-blogger-api
```

Requires React 18+ (React 19 supported) and any modern browser or runtime with `fetch`.

## Quick start

Wrap your app in `BloggerProvider` and call a hook:

```tsx
import { BloggerProvider, usePosts } from "react-blogger-api"

function App() {
  return (
    <BloggerProvider config={{ apiKey: "YOUR_API_KEY", defaultBlogId: "1234567890" }}>
      <PostList />
    </BloggerProvider>
  )
}

function PostList() {
  const { items, isLoading, error } = usePosts({ maxResults: 10 })

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed: {error.message}</p>
  return <ul>{items.map((post) => <li key={post.id}>{post.title}</li>)}</ul>
}
```

With `defaultBlogId` set, every blog-scoped hook resolves the blog automatically. Pass `options.blogId` per hook to override it.

## Provider configuration

`BloggerProvider` accepts a single `config` prop:

| Field | Type | Description |
| --- | --- | --- |
| `apiKey` | `string` | Blogger API key — enough for reading public blogs |
| `accessToken` | `string \| () => string \| Promise<string>` | OAuth 2.0 token for private blogs and all write operations. Pass a function to read a token that rotates |
| `defaultBlogId` | `string` | Blog ID used when a hook's own `blogId` is omitted |
| `baseUrl` | `string` | Override the API origin (testing, proxies) |
| `fetch` | `FetchLike` | Custom `fetch` implementation (testing, instrumentation) |

Every hook also works outside React through the standalone client:

```ts
import { createBloggerClient } from "react-blogger-api"

const client = createBloggerClient({ apiKey: "YOUR_API_KEY" })
const post = await client.posts.get({ blogId: "1234567890", postId: "42" })
```

## Authentication notes

- **Reads** on public blogs work with `apiKey` alone.
- **Writes** (`insert` / `update` / `patch` / `delete` / `publish` / `revert`) and any read of a private blog require `accessToken`, and the request is sent as `Authorization: Bearer <token>`.
- A token **can only be used from a server or a trusted environment**. Do not ship a long-lived token in browser code; proxy through your own backend or use short-lived tokens.
- Pass a **function** for `accessToken` when the token rotates — it is resolved per request.

## Hook catalogue

All 33 API methods are covered. Every hook is available from the package root.

### Posts — `blogger.posts.*`

| Hook | API method | Returns |
| --- | --- | --- |
| `usePosts(params?, options?)` | `list` | Paginated list, with `loadMore()` |
| `usePost(postId, params?, options?)` | `get` | A single post |
| `usePostByPath(path, params?, options?)` | `getByPath` | A single post by its URL path |
| `useSearchPosts(params?, options?)` | `search` | Paginated search results, with `loadMore()` |
| `useCreatePost()` | `insert` | Mutation → created `Post` |
| `useUpdatePost()` | `update` | Mutation → updated `Post` |
| `usePatchPost()` | `patch` | Mutation → patched `Post` |
| `useDeletePost()` | `delete` | Mutation → `undefined` |
| `usePublishPost()` | `publish` | Mutation → published `Post` |
| `useRevertPost()` | `revert` | Mutation → reverted `Post` |

### Pages — `blogger.pages.*`

| Hook | API method | Returns |
| --- | --- | --- |
| `usePages(params?, options?)` | `list` | Paginated list, with `loadMore()` |
| `usePage(pageId, params?, options?)` | `get` | A single page |
| `useCreatePage()` | `insert` | Mutation → created `Page` |
| `useUpdatePage()` | `update` | Mutation → updated `Page` |
| `usePatchPage()` | `patch` | Mutation → patched `Page` |
| `useDeletePage()` | `delete` | Mutation → `undefined` |
| `usePublishPage()` | `publish` | Mutation → published `Page` |
| `useRevertPage()` | `revert` | Mutation → reverted `Page` |

### Comments — `blogger.comments.*`

| Hook | API method | Returns |
| --- | --- | --- |
| `useComments(postId, params?, options?)` | `list` | Paginated list, with `loadMore()` |
| `useCommentsByBlog(params?, options?)` | `listByBlog` | Paginated list, with `loadMore()` |
| `useComment(postId, commentId, params?, options?)` | `get` | A single comment |
| `useDeleteComment()` | `delete` | Mutation → `undefined` |
| `useApproveComment()` | `approve` | Mutation → approved `Comment` |
| `useMarkCommentAsSpam()` | `markAsSpam` | Mutation → comment marked as spam |
| `useRemoveCommentContent()` | `removeContent` | Mutation → comment with content removed |

### Blogs, users, and analytics

| Hook | API method | Returns |
| --- | --- | --- |
| `useBlog(params?, options?)` | `blogs.get` | A single blog |
| `useBlogByUrl(url, params?, options?)` | `blogs.getByUrl` | A blog resolved from its URL |
| `useBlogsByUser(userId?, params?, options?)` | `blogs.listByUser` | Paginated list, with `loadMore()` |
| `useUser(userId?, options?)` | `users.get` | The authenticated user (or a specific user) |
| `usePageViews(params?, options?)` | `pageViews.get` | Page-view counts for a range |
| `usePostUserInfo(params?, options?)` | `postUserInfos.get` | Per-user info for one post |
| `usePostUserInfos(params?, options?)` | `postUserInfos.list` | Paginated per-user info, with `loadMore()` |
| `useBlogUserInfo(options?)` | `blogUserInfos.get` | Per-user info for a blog |

## Usage

### Query hooks

Query hooks return `{ data, error, isLoading, isValidating, refetch }`. The paginated ones (`usePosts`, `usePages`, `useComments`, `useCommentsByBlog`, `useSearchPosts`, `useBlogsByUser`, `usePostUserInfos`) additionally return `{ items, nextPageToken, loadMore }`, accumulating pages into `items` as you call `loadMore()`.

```tsx
import { usePosts } from "react-blogger-api"

function InfinitePosts() {
  const { items, isLoading, loadMore, nextPageToken } = usePosts({ maxResults: 25 })

  if (isLoading) return <p>Loading…</p>
  return (
    <>
      {items.map((post) => <article key={post.id}>{post.title}</article>)}
      {nextPageToken && <button onClick={loadMore}>Load more</button>}
    </>
  )
}
```

### Mutation hooks

Mutation hooks return `{ mutate, mutateAsync, data, error, status, reset }`, where `status` is `"idle" | "loading" | "success" | "error"`.

```tsx
import { useCreatePost } from "react-blogger-api"

function NewPost() {
  const { mutateAsync, status, error } = useCreatePost()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const created = await mutateAsync({ post: { title: "Hello", content: "<p>World</p>" } })
    console.log("created", created.id)
  }

  return (
    <form onSubmit={submit}>
      <button disabled={status === "loading"}>Create</button>
      {error && <p>{error.message}</p>}
    </form>
  )
}
```

Write hooks accept an optional `blogId` in their arguments, falling back to the provider's `defaultBlogId`.

### Cache invalidation

Mutations invalidate the queries they affect — creating a post clears the post list, publishing a page clears that page and the page list, and so on. You do not need to refetch by hand.

### Accessing the client directly

`useBlogger` exposes the underlying client, cache store, and default blog ID:

```tsx
import { useBlogger } from "react-blogger-api"

function RefreshButton() {
  const { store, defaultBlogId } = useBlogger()

  return <button onClick={() => store.invalidate(() => true)}>Refresh all</button>
}
```

### Building custom hooks

`useBloggerQuery` and `useBloggerMutation` are exported so you can build your own cache-backed hooks on the same infrastructure:

```tsx
import { useBlogger, useBloggerQuery } from "react-blogger-api"

function useMyThing() {
  const { client, store } = useBlogger()
  return useBloggerQuery({
    store,
    key: "my-key",
    fetcher: (signal) => client.blogs.get({ blogId: "1234567890" }, signal),
  })
}
```

### Testing

Pass a custom `fetch` to keep tests offline and deterministic:

```tsx
<BloggerProvider
  config={{
    apiKey: "test",
    fetch: async () => new Response(JSON.stringify({ id: "1", title: "Test" })),
  }}
>
  {children}
</BloggerProvider>
```

## TypeScript

All types are exported: resource types (`Post`, `Page`, `Comment`, `Blog`, `User`, `Pageviews`), list types (`PostList`, `PageList`, `CommentList`, `BlogList`), per-hook param types (`UsePostsParams`, `CreatePostArgs`, and so on), param enums (`POST_STATUSES`, `VIEW_TYPES`, …), and error types (`BloggerApiError`, `BloggerParseError`).

Blog and post IDs are branded at the client boundary, so a raw `string` cannot be passed where a `BlogId` is expected. Use the exported smart constructors when you hold an untrusted string:

```ts
import { toBlogId } from "react-blogger-api"

const blogId = toBlogId(userInput)
```

## Error handling

| Error | Meaning |
| --- | --- |
| `BloggerApiError` | Non-2xx response. Carries `status`, Google's `code`, and an `errors` list |
| `BloggerParseError` | Response body did not match the expected schema |

```ts
import { BloggerApiError } from "react-blogger-api"

try {
  await client.posts.get({ blogId, postId })
} catch (error) {
  if (error instanceof BloggerApiError) console.error(error.status, error.errors)
}
```

## Development

```sh
bun install
bun test          # 171 tests
bun run typecheck # tsc --noEmit
bun run lint      # biome check
bun run build     # bundle + type declarations into dist/
```

## License

MIT
