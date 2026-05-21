import { useEvent } from '@/shared/reactuse'

export function useOnBlurCommit(
  currentValue: string,
  originalValue: string | null | undefined,
  onCommit: (value: string) => void,
) {
  return useEvent(() => {
    const trimmed = currentValue.trim()
    const original = (originalValue ?? '').trim()
    if (trimmed !== original && trimmed) {
      onCommit(trimmed)
    }
  })
}

export function useOnBlurCommitNullable(
  currentValue: string,
  originalValue: string | null | undefined,
  onCommit: (value: string | null) => void,
) {
  return useEvent(() => {
    const trimmed = currentValue.trim()
    const original = originalValue?.trim() ?? ''
    if (trimmed !== original) {
      onCommit(trimmed || null)
    }
  })
}
