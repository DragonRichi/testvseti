"use client"

import { getGeoChatMessages } from "@/actions/getGeoChatMessages"
import type { GeoChatMessage } from "@/types/geoChat"
import type { Dispatch, RefObject, SetStateAction, TouchEvent } from "react"
import { useRef, useState } from "react"

const REFRESH_THRESHOLD = 70
const MAX_PULL_DISTANCE = 95

type Options = {
    roomId: string
    messagesContainerRef: RefObject<HTMLDivElement | null>
    setMessages: Dispatch<SetStateAction<GeoChatMessage[]>>
    setError: Dispatch<SetStateAction<string>>
}

function useGeoChatPullRefresh({ roomId, messagesContainerRef, setMessages, setError }: Options) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const [isPulling, setIsPulling] = useState(false)

    const refreshLockRef = useRef(false)
    const touchStartYRef = useRef<number | null>(null)
    const isPullingRef = useRef(false)

    const refreshMessages = async () => {
        if (refreshLockRef.current) return

        refreshLockRef.current = true
        setIsRefreshing(true)
        setError("")

        try {
            const result = await getGeoChatMessages(roomId)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setMessages(result.messages)
        } catch (error) {
            console.error("GEO CHAT REFRESH ERROR:", error)
            setError("Не удалось обновить сообщения")
        } finally {
            setPullDistance(0)
            isPullingRef.current = false
            setIsPulling(false)
            setIsRefreshing(false)
            refreshLockRef.current = false
        }
    }

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        const container = messagesContainerRef.current

        if (!container) return
        if (container.scrollTop > 0) return
        if (isRefreshing) return

        touchStartYRef.current = event.touches[0]?.clientY ?? null
        isPullingRef.current = false
        setIsPulling(false)
    }

    const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        const container = messagesContainerRef.current
        const startY = touchStartYRef.current
        const currentY = event.touches[0]?.clientY

        if (!container) return
        if (startY === null || currentY === undefined) return
        if (container.scrollTop > 0) return
        if (isRefreshing) return

        const distance = currentY - startY

        if (distance <= 0) {
            setPullDistance(0)
            isPullingRef.current = false
            setIsPulling(false)
            return
        }

        isPullingRef.current = true
        setIsPulling(true)
        setPullDistance(Math.min(distance * 0.55, MAX_PULL_DISTANCE))
    }

    const handleTouchEnd = () => {
        touchStartYRef.current = null

        if (!isPullingRef.current) {
            setPullDistance(0)
            setIsPulling(false)
            return
        }

        isPullingRef.current = false
        setIsPulling(false)

        if (pullDistance >= REFRESH_THRESHOLD) {
            void refreshMessages()
            return
        }

        setPullDistance(0)
    }

    return {
        isRefreshing,
        pullDistance,
        refreshReady: pullDistance >= REFRESH_THRESHOLD,
        isPulling,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    }
}

export default useGeoChatPullRefresh
