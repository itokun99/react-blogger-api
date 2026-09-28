import { QueryClient } from "@tanstack/react-query"
import type { QueryEntry } from "./queryStore"

const IDLE_ENTRY: QueryEntry<never> = {
	data: undefined,
	error: undefined,
	isFetching: false,
	updatedAt: 0,
	epoch: 0,
}

export interface TanstackQueryAdapterOptions {
	readonly queryClient: QueryClient
}

export function createTanstackQueryAdapter(options: TanstackQueryAdapterOptions): any {
	const { queryClient } = options
	const epochs = new Map<string, number>()

	return {
		getSnapshot<T>(key: string): QueryEntry<T> {
			const query = queryClient.getQueryCache().find({ queryKey: [key] })
			if (!query || !query.state.dataUpdatedAt) return IDLE_ENTRY as QueryEntry<T>

			return {
				data: query.state.data as T | undefined,
				error: query.state.error as Error | undefined,
				isFetching: (query.state as any).isFetching || false,
				updatedAt: query.state.dataUpdatedAt || 0,
				epoch: epochs.get(key) || 0,
			}
		},

		subscribe(key: string, listener: () => void): () => void {
			const query = queryClient.getQueryCache().find({ queryKey: [key] })
			if (!query) return () => { }

			// Cast to access internal subscription methods
			const queryAny = query as any
			const unsubscribe = queryAny.subscribe
				? queryAny.subscribe(() => {
					listener()
				})
				: () => { }

			return unsubscribe
		},

		async fetchOnce<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>): Promise<T> {
			const result = await queryClient.fetchQuery({
				queryKey: [key],
				queryFn: ({ signal }) => fetcher(signal as unknown as AbortSignal),
				staleTime: 0,
			})

			return result as T
		},

		invalidate(predicate: (key: string) => boolean): void {
			const queries = queryClient.getQueryCache().getAll()

			for (const query of queries) {
				const queryKey = query.queryKey[0] as string
				if (!predicate(queryKey)) continue

				queryClient.invalidateQueries({ queryKey: [queryKey] })
				const currentEpoch = epochs.get(queryKey) || 0
				epochs.set(queryKey, currentEpoch + 1)
			}
		},

		cancel(key: string): void {
			queryClient.cancelQueries({ queryKey: [key] })
		},
	}
}
