"use client"

import type {
    RefObject
} from "react"
import {
    useCallback,
    useEffect,
    useRef
} from "react"

type Options = {
    containerRef: RefObject<HTMLDivElement | null>
}

function useDirectComposerFocus({
    containerRef
}: Options) {
    const isFocusedRef =
        useRef(false)

    const scrollToBottom =
        useCallback(() => {
            const container =
                containerRef.current

            if (!container) {
                return
            }

            requestAnimationFrame(
                () => {
                    container.scrollTop =
                        container.scrollHeight
                }
            )
        }, [containerRef])

    const handleFocus =
        useCallback(() => {
            isFocusedRef.current =
                true

            scrollToBottom()
        }, [scrollToBottom])

    const handleBlur =
        useCallback(() => {
            isFocusedRef.current =
                false
        }, [])

    useEffect(() => {
        const viewport =
            window.visualViewport

        if (!viewport) {
            return
        }

        const handleViewportChange =
            () => {
                if (
                    !isFocusedRef.current
                ) {
                    return
                }

                scrollToBottom()
            }

        viewport.addEventListener(
            "resize",
            handleViewportChange
        )

        viewport.addEventListener(
            "scroll",
            handleViewportChange
        )

        return () => {
            viewport.removeEventListener(
                "resize",
                handleViewportChange
            )

            viewport.removeEventListener(
                "scroll",
                handleViewportChange
            )
        }
    }, [scrollToBottom])

    return {
        handleFocus,
        handleBlur
    }
}

export default useDirectComposerFocus