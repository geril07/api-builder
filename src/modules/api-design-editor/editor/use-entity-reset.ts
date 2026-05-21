import { useEffect, useRef } from 'react'

export function useEntityReset(id: string, onReset: () => void) {
  const prevId = useRef(id)
  const onResetRef = useRef(onReset)

  useEffect(() => {
    onResetRef.current = onReset
  })

  useEffect(() => {
    if (prevId.current !== id) {
      prevId.current = id
      onResetRef.current()
    }
  }, [id])
}
