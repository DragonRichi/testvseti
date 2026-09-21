"use client"

import type { RefObject } from "react"
import { useEffect, useRef } from "react"

type Options = {
    roomId: string
    messageCount: number
    messagesContainerRef: RefObject<HTMLDivElement | null>
    messagesEndRef: RefObject<HTMLDivElement | null>
}

const BOTTOM_THRESHOLD = 80

function useGeoChatBottomPin({
    roomId,
    messageCount,
    messagesContainerRef,
    messagesEndRef
}: Options) {
    const pinnedRef = useRef(true)
    const initializedRoomRef = useRef<string | null>(null)

    useEffect(() => {
        const container = messagesContainerRef.current
        const end = messagesEndRef.current

        if (!container || !end) return

        const content = end.parentElement

        if (!content) return

        const isNewRoom =
            initializedRoomRef.current !== roomId

        if (isNewRoom) {
            initializedRoomRef.current = roomId
            pinnedRef.current = true
        }

        const scrollToBottom = () => {
            container.scrollTop =
                container.scrollHeight
        }

        const handleScroll = () => {
            const distanceFromBottom =
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight

            pinnedRef.current =
                distanceFromBottom <=
                BOTTOM_THRESHOLD
        }

        let frameId: number | null = null

        const scheduleBottomScroll = () => {
            if (!pinnedRef.current) return

            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }

            frameId = requestAnimationFrame(
                scrollToBottom
            )
        }

        const resizeObserver =
            new ResizeObserver(() => {
                scheduleBottomScroll()
            })

        resizeObserver.observe(content)

        container.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        )

        if (isNewRoom) {
            requestAnimationFrame(() => {
                scrollToBottom()

                requestAnimationFrame(
                    scrollToBottom
                )
            })
        }

        return () => {
            resizeObserver.disconnect()

            container.removeEventListener(
                "scroll",
                handleScroll
            )

            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }
        }
    }, [
        messageCount,
        messagesContainerRef,
        messagesEndRef,
        roomId
    ])
}

export default useGeoChatBottomPin