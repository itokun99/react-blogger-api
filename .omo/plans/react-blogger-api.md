# react-blogger-api Implementation Plan

**Goal:** Ship an installable npm package (`react-blogger-api`) providing a fully-typed React hooks + Context wrapper over Google's Blogger API v3, built with Bun.

**Architecture:** A dependency-free (peer: react only) low-level `BloggerClient` covers all 33 Blogger v3 REST methods across 8 resources. A `BloggerProvider` (Context) holds the client + a `useSyncExternalStore`-based `QueryStore` cache. Two internal generic hooks (`useBloggerQuery`, `useBloggerMutation`) implement fetch/cache/de-dupe/invalidate once; 33 public resource hooks (1:1 with API methods) are thin typed wrappers over them.

**Tech Stack:** TypeScript (strict), React >=18 (peer), Bun (install/test/build), `bun build` + `tsc --emitDeclarationOnly` (no bundler dependency), `bun test` + `@happy-dom/global-registrator` + `@testing-library/react`, Biome (lint/format).

**Repo layout note:** repo root IS the package root (no monorepo/submodule prefix) - confirmed empty git-init'd repo, no existing package.json.

## Global Constraints
- Bun for install/test/build/run (user requirement).
- **REVISED after reading this repo's `programming` skill TypeScript references (they are explicit, hard project rules, not generic defaults):** runtime deps are `ky` (HTTP client - project iron rule: "production code must not use bare fetch()") + `zod` (boundary validation - project iron rule: "Zod at boundaries"). `react` is the peerDependency (`>=18.0.0`). Two small, well-justified runtime deps instead of zero.
- ESM-only output (`"type": "module"`), package name `react-blogger-api` (confirmed unclaimed on npm registry 2026-09-22).
- Every Blogger v3 API method (per live discovery doc https://www.googleapis.com/discovery/v1/apis/blogger/v3/rest, revision 20260917) gets exactly one `BloggerClient` method and exactly one public hook.
- TDD: RED test before GREEN implementation for every behavioral unit (client, cache, context, generic hooks, each public hook).
- File size ceiling 250 pure LOC; one responsibility per file.
- IDs are Zod-branded strings (`z.string().min(1).brand("BlogId")` etc. for BlogId/PostId/PageId/CommentId/UserId), per the project's "branded types for distinct IDs" iron rule. Public hook/client parameters accept plain `string` (branded values are subtypes of string, so both raw strings and already-branded values from prior responses work at call sites); each hook/method immediately parses the raw string into the branded type via a `toXId()` smart constructor at its own boundary (parse-don't-validate, applied at the point a raw external value enters), so ergonomics are preserved while internal code (cache keys, path building) works with the safer branded type throughout.
- API response bodies are validated via Zod schemas passed straight to `ky`'s `.json(schema)` (Standard Schema support - ky validates and returns `z.infer` output in one call, throwing `SchemaValidationError` on mismatch, which the client wraps as `BloggerParseError`). `HTTPError.data` (ky pre-parses the body before hooks run) is Zod-checked against the Google error envelope shape to build `BloggerApiError`.
- Auth resolution centralized in one `ky` `beforeRequest` hook: resolve `accessToken` (string or sync/async getter) first -> `Authorization: Bearer` header; else fall back to `apiKey` -> `key` search param. Ky's default retry (limit 2, methods get/put/head/delete/options/trace/query, statuses 408/413/429/500/502/503/504) is used as-is - it already excludes POST (non-idempotent inserts/publish/revert), so no manual retry-policy tuning needed.
- DELETE endpoints with no response body (posts.delete, pages.delete, comments.delete only - confirmed via discovery doc) are called without `.json()` and return `Promise<void>`.

## Full Blogger API v3 method -> hook map (source of truth, all confirmed via live discovery doc)

| Resource | Method | HTTP | Hook |
|---|---|---|---|
| blogs | get | GET /v3/blogs/{blogId} | useBlog |
| blogs | getByUrl | GET /v3/blogs/byurl | useBlogByUrl |
| blogs | listByUser | GET /v3/users/{userId}/blogs | useBlogsByUser |
| posts | list | GET /v3/blogs/{blogId}/posts | usePosts |
| posts | get | GET /v3/blogs/{blogId}/posts/{postId} | usePost |
| posts | getByPath | GET /v3/blogs/{blogId}/posts/bypath | usePostByPath |
| posts | search | GET /v3/blogs/{blogId}/posts/search | useSearchPosts |
| posts | insert | POST /v3/blogs/{blogId}/posts | useCreatePost |
| posts | update | PUT /v3/blogs/{blogId}/posts/{postId} | useUpdatePost |
| posts | patch | PATCH /v3/blogs/{blogId}/posts/{postId} | usePatchPost |
| posts | delete | DELETE /v3/blogs/{blogId}/posts/{postId} | useDeletePost |
| posts | publish | POST .../posts/{postId}/publish | usePublishPost |
| posts | revert | POST .../posts/{postId}/revert | useRevertPost |
| pages | list | GET /v3/blogs/{blogId}/pages | usePages |
| pages | get | GET /v3/blogs/{blogId}/pages/{pageId} | usePage |
| pages | insert | POST /v3/blogs/{blogId}/pages | useCreatePage |
| pages | update | PUT .../pages/{pageId} | useUpdatePage |
| pages | patch | PATCH .../pages/{pageId} | usePatchPage |
| pages | delete | DELETE .../pages/{pageId} | useDeletePage |
| pages | publish | POST .../pages/{pageId}/publish | usePublishPage |
| pages | revert | POST .../pages/{pageId}/revert | useRevertPage |
| comments | list | GET .../posts/{postId}/comments | useComments |
| comments | listByBlog | GET /v3/blogs/{blogId}/comments | useCommentsByBlog |
| comments | get | GET .../comments/{commentId} | useComment |
| comments | delete | DELETE .../comments/{commentId} | useDeleteComment |
| comments | approve | POST .../comments/{commentId}/approve | useApproveComment |
| comments | markAsSpam | POST .../comments/{commentId}/spam | useMarkCommentAsSpam |
| comments | removeContent | POST .../comments/{commentId}/removecontent | useRemoveCommentContent |
| users | get | GET /v3/users/{userId} | useUser |
| pageViews | get | GET /v3/blogs/{blogId}/pageviews | usePageViews |
| postUserInfos | list | GET /v3/users/{userId}/blogs/{blogId}/posts | usePostUserInfos |
| postUserInfos | get | GET .../posts/{postId} | usePostUserInfo |
| blogUserInfos | get | GET /v3/users/{userId}/blogs/{blogId} | useBlogUserInfo |

(33 methods, 33 hooks + `useBlogger` context accessor = 34 exported hooks total)

---

## TODOs

### Phase 1 - Scaffold
- [x] Create package.json (name react-blogger-api, type module, exports map, peerDeps, scripts)
- [x] Create tsconfig.json + tsconfig.build.json (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax, jsx react-jsx)
- [x] Create biome.json (lint+format)
- [x] Create bunfig.toml (test preload for happy-dom + testing-library)
- [x] Create .gitignore, LICENSE (MIT)
- [x] Install dependencies via bun add (react/react-dom/typescript/@types/*/happy-dom registrator/testing-library/biome as devDeps)

### Phase 2 - Types
- [x] Write src/types/ids.ts (BlogId/PostId/PageId/CommentId/UserId string aliases)
- [x] Write src/types/resources.ts (Blog, Post, Page, Comment, User, Pageviews, *List, PostUserInfo(s), BlogUserInfo, BlogPerUserInfo schemas from discovery doc)
- [x] Write src/types/params.ts (per-method param types: enums ViewType/PostStatus/PageStatus/CommentStatus/Role/OrderBy/TimeRange)
- [x] Write src/types/errors.ts (BloggerApiError + error envelope parser)

### Phase 3 - Core client (TDD)
- [x] tests/client/request.test.ts: RED for URL/query/path building + auth header/key resolution
- [x] src/client/request.ts: GREEN minimal implementation
- [x] tests/client/BloggerClient.test.ts: RED for all 8 resource namespaces (representative method per resource + full posts set)
- [x] src/client/BloggerClient.ts: GREEN implementation covering all 33 methods

### Phase 4 - Cache store (TDD)
- [x] tests/cache/queryStore.test.ts: RED for subscribe/getSnapshot/setEntry/invalidate/fetchOnce de-dupe
- [x] src/cache/queryStore.ts: GREEN implementation

### Phase 5 - Context (TDD)
- [x] tests/context/BloggerProvider.test.tsx: RED for provider mounting + useBlogger throwing outside provider
- [x] src/context/BloggerContext.ts + src/context/BloggerProvider.tsx: GREEN implementation
- [x] tests/helpers/renderWithBlogger.tsx: shared test harness (fake fetch + wrapper) for all hook tests

### Phase 6 - Generic hooks (TDD)
- [x] tests/hooks/internal/useBloggerQuery.test.tsx: RED (loading->success, error, de-dupe, key-null disables)
- [x] src/hooks/internal/useBloggerQuery.ts: GREEN
- [x] tests/hooks/internal/useBloggerMutation.test.tsx: RED (idle->loading->success/error, onSuccess callback)
- [x] src/hooks/internal/useBloggerMutation.ts: GREEN
- [x] src/utils/queryKey.ts: buildKey helper + test

### Phase 7 - Template hooks (TDD, become the pattern subagents copy)
- [x] tests/hooks/posts/usePost.test.tsx + src/hooks/posts/usePost.ts (query template)
- [x] tests/hooks/posts/useCreatePost.test.tsx + src/hooks/posts/useCreatePost.ts (mutation template, incl. cache invalidation)
- [x] tests/hooks/misc/useUser.test.tsx + src/hooks/misc/useUser.ts (defaulted-arg query template)

### Phase 8 - Delegated hooks (parallel subagents, disjoint files, TDD each)
- [x] Posts remainder (8): usePosts, usePostByPath, useSearchPosts, useUpdatePost, usePatchPost, useDeletePost, usePublishPost, useRevertPost
- [x] Pages (8): usePages, usePage, useCreatePage, useUpdatePage, usePatchPage, useDeletePage, usePublishPage, useRevertPage
- [x] Comments (7): useComments, useCommentsByBlog, useComment, useDeleteComment, useApproveComment, useMarkCommentAsSpam, useRemoveCommentContent
- [x] Blogs+Misc (7): useBlog, useBlogByUrl, useBlogsByUser, usePageViews, usePostUserInfo, usePostUserInfos, useBlogUserInfo

### Phase 9 - Integration
- [x] Wire src/hooks/index.ts + src/index.ts barrel exports (client, context, all hooks, all types)
- [x] tests/coverage.test.ts: RED->GREEN proof that every discovery-doc method has a client method + exported hook

### Phase 10 - Build & verification
- [x] Add build script (bun build --format esm --external react --target browser + tsc --emitDeclarationOnly), run it, fix errors
- [x] Run full `bun test`, fix failures, zero skips
- [x] Run `bunx tsc --noEmit` strict, zero errors
- [x] Run biome check, zero errors
- [x] Write tests/dist-smoke.test.ts importing from built dist/, exercising one query + one mutation hook
- [x] Run `bun pm pack --dry-run` (or npm pack --dry-run) to confirm installable tarball contents

### Phase 11 - Docs & wrap-up
- [x] Write README.md (install, BloggerProvider setup, hook catalogue table, auth notes)
- [x] Self-review against programming skill checklist (LOC, boundary purity, exhaustive matches, escape hatches, tests)
- [x] Final notepad update + report to user
