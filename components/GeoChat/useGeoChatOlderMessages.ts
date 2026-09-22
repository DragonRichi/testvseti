"use client"

import { getOlderGeoChatMessages } from "@/actions/getOlderGeoChatMessages"
import type { GeoChatMessage } from "@/types/geoChat"
import type {
    Dispatch,
    RefObject,
    SetStateAction
} from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from "react"

type Options = {
    roomId: string
    messages: GeoChatMessage[]
    setMessages:
        Dispatch<
            SetStateAction<
                GeoChatMessage[]
            >
        >
    initialHasMore: boolean
    messagesContainerRef:
        RefObject<HTMLDivElement | null>
    setError: (
        value: string
    ) => void
}

type PendingScrollRestore = {
    scrollHeight: number
    scrollTop: number
}

const LOAD_THRESHOLD = 240

function compareMessages(
    first: GeoChatMessage,
    second: GeoChatMessage
) {
    const firstTime =
        new Date(
            first.createdAt
        ).getTime()

    const secondTime =
        new Date(
            second.createdAt
        ).getTime()

    if (
        firstTime !== secondTime
    ) {
        return firstTime - secondTime
    }

    return first.id.localeCompare(
        second.id
    )
}

function useGeoChatOlderMessages({
    roomId,
    messages,
    setMessages,
    initialHasMore,
    messagesContainerRef,
    setError
}: Options) {
    const [
        hasMore,
        setHasMore
    ] =
        useState(initialHasMore)

    const [
        isLoadingOlder,
        setIsLoadingOlder
    ] =
        useState(false)

    const messagesRef =
        useRef(messages)

    const hasMoreRef =
        useRef(initialHasMore)

    const loadingRef =
        useRef(false)

    const activeRoomIdRef =
        useRef(roomId)

    const lastScrollTopRef =
        useRef(0)

    const pendingRestoreRef =
        useRef<
            PendingScrollRestore | null
        >(null)

    useEffect(() => {
        messagesRef.current =
            messages
    }, [messages])

    useEffect(() => {
        if (
            activeRoomIdRef.current ===
            roomId
        ) {
            return
        }

        activeRoomIdRef.current =
            roomId

        hasMoreRef.current =
            initialHasMore

        loadingRef.current =
            false

        pendingRestoreRef.current =
            null

        setHasMore(
            initialHasMore
        )

        setIsLoadingOlder(
            false
        )
    }, [
        initialHasMore,
        roomId
    ])

    useLayoutEffect(() => {
        const pending =
            pendingRestoreRef.current

        const container =
            messagesContainerRef.current

        if (
            !pending ||
            !container
        ) {
            return
        }

        const heightDifference =
            container.scrollHeight -
            pending.scrollHeight

        container.scrollTop =
            pending.scrollTop +
            heightDifference

        lastScrollTopRef.current =
            container.scrollTop

        pendingRestoreRef.current =
            null
    }, [
        messages.length,
        messagesContainerRef
    ])

    const loadOlder =
        useCallback(async () => {
            if (
                loadingRef.current ||
                !hasMoreRef.current
            ) {
                return
            }

            const currentMessages =
                messagesRef.current

            const oldestMessage =
                currentMessages[0]

            const container =
                messagesContainerRef.current

            if (
                !oldestMessage ||
                !container
            ) {
                return
            }

            loadingRef.current =
                true

            setIsLoadingOlder(
                true
            )

            setError("")

            const previousScrollHeight =
                container.scrollHeight

            const previousScrollTop =
                container.scrollTop

            try {
                const result =
                    await getOlderGeoChatMessages(
                        roomId,
                        oldestMessage.createdAt,
                        oldestMessage.id
                    )

                if (
                    result.success ===
                    false
                ) {
                    setError(
                        result.error
                    )

                    return
                }

                hasMoreRef.current =
                    result.hasMore

                setHasMore(
                    result.hasMore
                )

                if (
                    result.messages
                        .length === 0
                ) {
                    return
                }

                pendingRestoreRef.current =
                    {
                        scrollHeight:
                            previousScrollHeight,
                        scrollTop:
                            previousScrollTop
                    }

                setMessages(
                    (
                        currentMessages
                    ) => {
                        const existingIds =
                            new Set(
                                currentMessages.map(
                                    (
                                        message
                                    ) =>
                                        message.id
                                )
                            )

                        const olderMessages =
                            result.messages.filter(
                                (
                                    message
                                ) =>
                                    !existingIds.has(
                                        message.id
                                    )
                            )

                        if (
                            olderMessages.length ===
                            0
                        ) {
                            pendingRestoreRef.current =
                                null

                            return currentMessages
                        }

                        return [
                            ...olderMessages,
                            ...currentMessages
                        ].sort(
                            compareMessages
                        )
                    }
                )
            } catch (error) {
                console.error(
                    "GEO CHAT OLDER LOAD ERROR:",
                    error
                )

                setError(
                    "Не удалось загрузить старые сообщения"
                )
            } finally {
                loadingRef.current =
                    false

                setIsLoadingOlder(
                    false
                )
            }
        }, [
            messagesContainerRef,
            roomId,
            setError,
            setMessages
        ])

    useEffect(() => {
        const container =
            messagesContainerRef.current

        if (!container) {
            return
        }

        lastScrollTopRef.current =
            container.scrollTop

        const handleScroll = () => {
            const currentScrollTop =
                container.scrollTop

            const previousScrollTop =
                lastScrollTopRef.current

            const isMovingUp =
                currentScrollTop <
                previousScrollTop

            lastScrollTopRef.current =
                currentScrollTop

            if (
                isMovingUp &&
                currentScrollTop <=
                    LOAD_THRESHOLD
            ) {
                void loadOlder()
            }
        }

        container.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true
            }
        )

        return () => {
            container.removeEventListener(
                "scroll",
                handleScroll
            )
        }
    }, [
        loadOlder,
        messagesContainerRef
    ])

    return {
        hasMore,
        isLoadingOlder,
        loadOlder
    }
}

export default useGeoChatOlderMessages