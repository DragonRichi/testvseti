"use client"

import type { RefObject } from "react"
import { useCallback, useEffect, useRef } from "react"

type Options = {
    containerRef: RefObject<HTMLDivElement | null>
}

function useDirectComposerFocus({
    containerRef
}: Options) {
    const isFocusedRef = useRef(false)
    const timersRef = useRef<number[]>([])

    const clearTimers = useCallback(() => {
        for (const timer of timersRef.current) {
            window.clearTimeout(timer)
        }

        timersRef.current = []
    }, [])

    const scrollToBottom = useCallback(() => {
        const container = containerRef.current

        if (!container) {
            return
        }

        container.scrollTop = container.scrollHeight
    }, [containerRef])

    const scheduleBottomPin = useCallback(() => {
        clearTimers()

        window.requestAnimationFrame(scrollToBottom)

        timersRef.current = [
            window.setTimeout(scrollToBottom, 60),
            window.setTimeout(scrollToBottom, 180)
        ]
    }, [clearTimers, scrollToBottom])

    const handleFocus = useCallback(() => {
        isFocusedRef.current = true
        scheduleBottomPin()
    }, [scheduleBottomPin])

    const handleBlur = useCallback(() => {
        isFocusedRef.current = false
        clearTimers()
    }, [clearTimers])

    useEffect(() => {
        const viewport = window.visualViewport

        if (!viewport) {
            return clearTimers
        }

        const handleViewportChange = () => {
            if (!isFocusedRef.current) {
                return
            }

            scheduleBottomPin()
        }

        viewport.addEventListener("resize", handleViewportChange)
        viewport.addEventListener("scroll", handleViewportChange)

        return () => {
            clearTimers()
            viewport.removeEventListener("resize", handleViewportChange)
            viewport.removeEventListener("scroll", handleViewportChange)
        }
    }, [clearTimers, scheduleBottomPin])

    return {
        handleFocus,
        handleBlur
    }
}

export default useDirectComposerFocus
