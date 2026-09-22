"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 1024
const MOBILE_HEADER_HEIGHT = 64

type MobileViewportStyle = Pick<
    CSSProperties,
    "top" | "bottom" | "height"
>

function getMobileViewportStyle(): MobileViewportStyle | undefined {
    if (window.innerWidth >= MOBILE_BREAKPOINT) {
        return undefined
    }

    const viewport = window.visualViewport

    if (!viewport) {
        return {
            top: `${MOBILE_HEADER_HEIGHT}px`,
            bottom: "auto",
            height: `calc(100dvh - ${MOBILE_HEADER_HEIGHT}px)`
        }
    }

    const viewportTop = viewport.offsetTop
    const viewportBottom =
        viewport.offsetTop + viewport.height

    const roomTop = Math.max(
        MOBILE_HEADER_HEIGHT,
        viewportTop
    )

    const roomHeight = Math.max(
        0,
        viewportBottom - roomTop
    )

    return {
        top: `${Math.round(roomTop)}px`,
        bottom: "auto",
        height: `${Math.round(roomHeight)}px`
    }
}

function useGeoChatVisualViewport() {
    const [style, setStyle] =
        useState<MobileViewportStyle>()

    useEffect(() => {
        const viewport = window.visualViewport

        let frameId: number | null = null
        let settleTimer:
            | ReturnType<typeof setTimeout>
            | null = null

        const applyViewport = () => {
            frameId = null

            const nextStyle =
                getMobileViewportStyle()

            setStyle((currentStyle) => {
                if (
                    !currentStyle &&
                    !nextStyle
                ) {
                    return currentStyle
                }

                if (
                    currentStyle &&
                    nextStyle &&
                    currentStyle.top ===
                        nextStyle.top &&
                    currentStyle.bottom ===
                        nextStyle.bottom &&
                    currentStyle.height ===
                        nextStyle.height
                ) {
                    return currentStyle
                }

                return nextStyle
            })
        }

        const scheduleViewportUpdate = () => {
            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }

            frameId =
                requestAnimationFrame(
                    applyViewport
                )
        }

        const handleFocusChange = () => {
            scheduleViewportUpdate()

            if (settleTimer !== null) {
                clearTimeout(settleTimer)
            }

            settleTimer = setTimeout(
                scheduleViewportUpdate,
                250
            )
        }

        scheduleViewportUpdate()

        window.addEventListener(
            "resize",
            scheduleViewportUpdate,
            { passive: true }
        )

        window.addEventListener(
            "orientationchange",
            scheduleViewportUpdate,
            { passive: true }
        )

        window.addEventListener(
            "focusin",
            handleFocusChange
        )

        window.addEventListener(
            "focusout",
            handleFocusChange
        )

        viewport?.addEventListener(
            "resize",
            scheduleViewportUpdate,
            { passive: true }
        )

        viewport?.addEventListener(
            "scroll",
            scheduleViewportUpdate,
            { passive: true }
        )

        return () => {
            window.removeEventListener(
                "resize",
                scheduleViewportUpdate
            )

            window.removeEventListener(
                "orientationchange",
                scheduleViewportUpdate
            )

            window.removeEventListener(
                "focusin",
                handleFocusChange
            )

            window.removeEventListener(
                "focusout",
                handleFocusChange
            )

            viewport?.removeEventListener(
                "resize",
                scheduleViewportUpdate
            )

            viewport?.removeEventListener(
                "scroll",
                scheduleViewportUpdate
            )

            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }

            if (settleTimer !== null) {
                clearTimeout(settleTimer)
            }
        }
    }, [])

    return style
}

export default useGeoChatVisualViewport