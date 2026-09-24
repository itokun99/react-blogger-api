import { useCallback, useState } from "react"

export type MutationStatus = "idle" | "loading" | "success" | "error"

export interface BloggerMutationSpec<TArgs, TResult> {
  readonly mutationFn: (args: TArgs) => Promise<TResult>
  readonly onSuccess?: (data: TResult, args: TArgs) => void
  readonly onError?: (error: Error, args: TArgs) => void
}

export interface UseBloggerMutationResult<TArgs, TResult> {
  readonly mutate: (args: TArgs) => void
  readonly mutateAsync: (args: TArgs) => Promise<TResult>
  readonly status: MutationStatus
  readonly data: TResult | undefined
  readonly error: Error | undefined
  readonly reset: () => void
}

interface MutationState<TResult> {
  readonly status: MutationStatus
  readonly data: TResult | undefined
  readonly error: Error | undefined
}

const IDLE_STATE: MutationState<never> = { status: "idle", data: undefined, error: undefined }

export function useBloggerMutation<TArgs, TResult>(
  spec: BloggerMutationSpec<TArgs, TResult>,
): UseBloggerMutationResult<TArgs, TResult> {
  const { mutationFn, onSuccess, onError } = spec
  const [state, setState] = useState<MutationState<TResult>>(IDLE_STATE)

  const mutateAsync = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setState({ status: "loading", data: undefined, error: undefined })
      try {
        const result = await mutationFn(args)
        setState({ status: "success", data: result, error: undefined })
        onSuccess?.(result, args)
        return result
      } catch (reason) {
        const error = reason instanceof Error ? reason : new Error(String(reason))
        setState({ status: "error", data: undefined, error })
        onError?.(error, args)
        throw error
      }
    },
    [mutationFn, onSuccess, onError],
  )

  const mutate = useCallback(
    (args: TArgs): void => {
      mutateAsync(args).catch(() => {
        // fire-and-forget variant: the error already landed in `state.error`
        // via mutateAsync's catch block above, so nothing here needs it -
        // this only exists to prevent an unhandled promise rejection.
      })
    },
    [mutateAsync],
  )

  const reset = useCallback(() => {
    setState(IDLE_STATE)
  }, [])

  return { mutate, mutateAsync, status: state.status, data: state.data, error: state.error, reset }
}
