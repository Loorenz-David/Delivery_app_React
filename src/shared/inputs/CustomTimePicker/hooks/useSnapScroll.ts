import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type UseSnapScrollParams = {
  values: number[]
  value: number
  itemHeight: number
  onChange: (nextValue: number) => void
}

export const useSnapScroll = ({
  values,
  value,
  itemHeight,
  onChange,
}: UseSnapScrollParams) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const wheelCaptureRef = useRef(false)
  const isUserScrollingRef = useRef(false)
  const suppressNextScrollRef = useRef(false)
  const [visualIndex, setVisualIndex] = useState(0)

  const selectedIndex = useMemo(() => {
    const index = values.indexOf(value)
    return index >= 0 ? index : 0
  }, [value, values])

  useEffect(() => {
    if (isUserScrollingRef.current) {
      return
    }
    setVisualIndex(selectedIndex)
  }, [selectedIndex])

  const scrollToIndex = useCallback(
    (
      index: number,
      behavior: ScrollBehavior = 'smooth',
      suppressScrollHandler = false,
    ) => {
      const node = scrollRef.current
      if (!node) {
        return
      }

      const clampedIndex = Math.max(0, Math.min(values.length - 1, index))
      setVisualIndex(clampedIndex)
      if (suppressScrollHandler) {
        suppressNextScrollRef.current = true
      }
      node.scrollTo({
        top: clampedIndex * itemHeight,
        behavior,
      })
    },
    [itemHeight, values.length],
  )

  const scrollToValue = useCallback(
    (nextValue: number, behavior: ScrollBehavior = 'smooth') => {
      const index = values.indexOf(nextValue)
      if (index < 0) {
        return
      }
      scrollToIndex(index, behavior)
    },
    [scrollToIndex, values],
  )

  useEffect(() => {
    if (isUserScrollingRef.current) {
      return
    }
    scrollToValue(value, 'auto')
  }, [scrollToValue, value])

  const snapToNearest = useCallback(() => {
    const node = scrollRef.current
    if (!node) {
      isUserScrollingRef.current = false
      return
    }

    const nearestIndex = Math.round(node.scrollTop / itemHeight)
    const clampedIndex = Math.max(0, Math.min(values.length - 1, nearestIndex))
    const nextValue = values[clampedIndex]
    setVisualIndex(clampedIndex)

    if (nextValue !== value) {
      onChange(nextValue)
    }
    scrollToIndex(clampedIndex, 'auto', true)
    isUserScrollingRef.current = false
  }, [itemHeight, onChange, scrollToIndex, value, values])

  const onWheel = useCallback(
    () => {
      if (!wheelCaptureRef.current) {
        return
      }
      isUserScrollingRef.current = true
    },
    [],
  )

  const onScroll = useCallback(() => {
    if (suppressNextScrollRef.current) {
      suppressNextScrollRef.current = false
      return
    }

    isUserScrollingRef.current = true
    const node = scrollRef.current
    if (node) {
      const nearestIndex = Math.round(node.scrollTop / itemHeight)
      const clampedIndex = Math.max(0, Math.min(values.length - 1, nearestIndex))
      setVisualIndex(clampedIndex)
    }
  }, [itemHeight, values.length])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) {
      return
    }

    const handleScrollEnd = () => {
      snapToNearest()
    }

    node.addEventListener('scrollend', handleScrollEnd as EventListener)
    return () => {
      node.removeEventListener('scrollend', handleScrollEnd as EventListener)
    }
  }, [snapToNearest])

  const onPointerEnter = useCallback(() => {
    wheelCaptureRef.current = true
  }, [])

  const onPointerLeave = useCallback(() => {
    wheelCaptureRef.current = false
  }, [])

  return {
    scrollRef,
    selectedIndex: visualIndex,
    scrollToValue,
    onWheel,
    onScroll,
    onPointerEnter,
    onPointerLeave,
  }
}
