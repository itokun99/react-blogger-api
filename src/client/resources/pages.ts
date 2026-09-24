import type { KyInstance } from "ky"
import type { BlogId, PageId } from "../../types/ids"
import { type PageList, PageListSchema } from "../../types/lists"
import type { PageStatus, ViewType } from "../../types/params"
import { type Page, PageSchema } from "../../types/resources"
import { requestJson, requestVoid } from "../request"

export interface ListPagesParams {
  readonly blogId: BlogId
  readonly status?: readonly PageStatus[] | undefined
  readonly view?: ViewType | undefined
  readonly fetchBodies?: boolean | undefined
  readonly maxResults?: number | undefined
  readonly pageToken?: string | undefined
}

export interface GetPageParams {
  readonly blogId: BlogId
  readonly pageId: PageId
  readonly view?: ViewType | undefined
}

export interface InsertPageParams {
  readonly blogId: BlogId
  readonly isDraft?: boolean | undefined
}

export interface UpdatePageParams {
  readonly blogId: BlogId
  readonly pageId: PageId
  readonly revert?: boolean | undefined
  readonly publish?: boolean | undefined
}

export type PatchPageParams = UpdatePageParams

export interface DeletePageParams {
  readonly blogId: BlogId
  readonly pageId: PageId
  readonly useTrash?: boolean | undefined
}

export interface PublishPageParams {
  readonly blogId: BlogId
  readonly pageId: PageId
}

export type RevertPageParams = PublishPageParams

export interface PagesResource {
  list(params: ListPagesParams, signal?: AbortSignal): Promise<PageList>
  get(params: GetPageParams, signal?: AbortSignal): Promise<Page>
  insert(params: InsertPageParams, body: Page, signal?: AbortSignal): Promise<Page>
  update(params: UpdatePageParams, body: Page, signal?: AbortSignal): Promise<Page>
  patch(params: PatchPageParams, body: Page, signal?: AbortSignal): Promise<Page>
  delete(params: DeletePageParams, signal?: AbortSignal): Promise<void>
  publish(params: PublishPageParams, signal?: AbortSignal): Promise<Page>
  revert(params: RevertPageParams, signal?: AbortSignal): Promise<Page>
}

export function createPagesResource(http: KyInstance): PagesResource {
  return {
    list({ blogId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/pages`, PageListSchema, {
        searchParams: query,
        signal,
      })
    },
    get({ blogId, pageId, ...query }, signal) {
      return requestJson(http, "get", `v3/blogs/${blogId}/pages/${pageId}`, PageSchema, {
        searchParams: query,
        signal,
      })
    },
    insert({ blogId, ...query }, body, signal) {
      return requestJson(http, "post", `v3/blogs/${blogId}/pages`, PageSchema, {
        searchParams: query,
        json: body,
        signal,
      })
    },
    update({ blogId, pageId, ...query }, body, signal) {
      return requestJson(http, "put", `v3/blogs/${blogId}/pages/${pageId}`, PageSchema, {
        searchParams: query,
        json: body,
        signal,
      })
    },
    patch({ blogId, pageId, ...query }, body, signal) {
      return requestJson(http, "patch", `v3/blogs/${blogId}/pages/${pageId}`, PageSchema, {
        searchParams: query,
        json: body,
        signal,
      })
    },
    delete({ blogId, pageId, ...query }, signal) {
      return requestVoid(http, "delete", `v3/blogs/${blogId}/pages/${pageId}`, {
        searchParams: query,
        signal,
      })
    },
    publish({ blogId, pageId }, signal) {
      return requestJson(http, "post", `v3/blogs/${blogId}/pages/${pageId}/publish`, PageSchema, {
        signal,
      })
    },
    revert({ blogId, pageId }, signal) {
      return requestJson(http, "post", `v3/blogs/${blogId}/pages/${pageId}/revert`, PageSchema, {
        signal,
      })
    },
  }
}
