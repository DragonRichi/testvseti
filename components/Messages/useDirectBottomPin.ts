"use client"

import type { RefObject } from "react"
import {
    useEffect,
    useRef
} from "react"

type Options = {
    conversationId: string
    messageCount: number
    containerRef: RefObject<HTMLDivElement | null>
    endRef: RefObject<HTMLDivElement | null>
}

const BOTTOM_THRESHOLD = 80

function useDirectBottomPin({
    conversationId,
    messageCount,
    containerRef,
    endRef
}: Options) {
    const pinnedRef =
        useRef(true)

    const initializedRef =
        useRef<string | null>(
            null
        )

    useEffect(() => {
        const container =
            containerRef.current

        const end =
            endRef.current

        if (
            !container ||
            !end
        ) {
            return
        }

        const content =
            end.parentElement

        if (!content) return

        const isNewConversation =
            initializedRef.current !==
            conversationId

        if (isNewConversation) {
            initializedRef.current =
                conversationId

            pinnedRef.current =
                true
        }

        const scrollToBottom =
            () => {
                container.scrollTop =
                    container.scrollHeight
            }

        const handleScroll =
            () => {
                const distance =
                    container.scrollHeight -
                    container.scrollTop -
                    container.clientHeight

                pinnedRef.current =
                    distance <=
                    BOTTOM_THRESHOLD
            }

        let frameId:
            number | null =
            null

        const scheduleBottom =
            () => {
                if (
                    !pinnedRef.current
                ) {
                    return
                }

                if (
                    frameId !==
                    null
                ) {
                    cancelAnimationFrame(
                        frameId
                    )
                }

                frameId =
                    requestAnimationFrame(
                        scrollToBottom
                    )
            }

        const observer =
            new ResizeObserver(
                scheduleBottom
            )

        observer.observe(
            content
        )

        container.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true
            }
        )

        if (
            isNewConversation
        ) {
            requestAnimationFrame(
                () => {
                    scrollToBottom()

                    requestAnimationFrame(
                        scrollToBottom
                    )
                }
            )
        }

        return () => {
            observer.disconnect()

            container.removeEventListener(
                "scroll",
                handleScroll
            )

            if (
                frameId !== null
            ) {
                cancelAnimationFrame(
                    frameId
                )
            }
        }
    }, [
        containerRef,
        conversationId,
        endRef,
        messageCount
    ])
}

export default useDirectBottomPin