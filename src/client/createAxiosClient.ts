import axios, { type AxiosInstance } from "axios"
import type { z } from "zod"
import { BloggerApiError, BloggerParseError } from "../types/errors"
import type { BloggerClientConfig } from "./config"
import { buildSearchParams } from "./searchParams"
import type { HttpClient, HttpClientRequestOptions } from "./httpClient"

const DEFAULT_BASE_URL = "https://blogger.googleapis.com/"

function toAxiosError(error: unknown): never {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status
		const body = error.response?.data
		if (status !== undefined) {
			throw BloggerApiError.fromResponseBody(status, body, error)
		}
	}
	throw error
}

function buildAxiosConfig(options?: HttpClientRequestOptions): any {
	const config: any = {}
	if (options?.searchParams) {
		config.params = Object.fromEntries(buildSearchParams(options.searchParams))
	}
	if (options?.signal) {
		config.signal = options.signal
	}
	return config
}

export function createAxiosClient(config: BloggerClientConfig): HttpClient {
	const instance = axios.create({
		baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
		...(config.fetch ? { adapter: config.fetch as any } : {}),
	})

	instance.interceptors.request.use(async (reqConfig) => {
		const token =
			typeof config.accessToken === "function"
				? await config.accessToken()
				: config.accessToken
		if (token) {
			reqConfig.headers.Authorization = `Bearer ${token}`
		} else if (config.apiKey) {
			const url = new URL(reqConfig.baseURL + reqConfig.url!)
			url.searchParams.set("key", config.apiKey)
			return { ...reqConfig, url: url.toString() }
		}
		return reqConfig
	})

	return {
		async get<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const resp = await instance.get<T>(path, buildAxiosConfig(options))
				return resp.data
			} catch (error) {
				return toAxiosError(error)
			}
		},
		async post<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const resp = await instance.post<T>(path, options?.json, buildAxiosConfig(options))
				return resp.data
			} catch (error) {
				return toAxiosError(error)
			}
		},
		async put<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const resp = await instance.put<T>(path, options?.json, buildAxiosConfig(options))
				return resp.data
			} catch (error) {
				return toAxiosError(error)
			}
		},
		async patch<T>(path: string, options?: HttpClientRequestOptions): Promise<T> {
			try {
				const resp = await instance.patch<T>(path, options?.json, buildAxiosConfig(options))
				return resp.data
			} catch (error) {
				return toAxiosError(error)
			}
		},
		async delete(path: string, options?: HttpClientRequestOptions): Promise<void> {
			try {
				await instance.delete(path, buildAxiosConfig(options))
			} catch (error) {
				return toAxiosError(error)
			}
		},
	}
}
