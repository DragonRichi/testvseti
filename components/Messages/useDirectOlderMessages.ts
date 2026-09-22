"use client"

import { getOlderDirectMessages } from "@/actions/getOlderDirectMessages"
import type { DirectMessage } from "@/types/directMessages"
import type {
    Dispatch,
    RefObject,
    SetStateAction
} from "react"
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from "react"

type Options = {
    conversationId: string
    messages: DirectMessage[]
    setMessages: Dispatch<
        SetStateAction<
            DirectMessage[]
        >
    >
    initialHasMore: boolean
    containerRef: RefObject<HTMLDivElement | null>
    onError: (
        message: string
    ) => void
}

type PendingRestore = {
    scrollHeight: number
    scrollTop: number
}

function useDirectOlderMessages({
    conversationId,
    messages,
    setMessages,
    initialHasMore,
    containerRef,
    onError
}: Options) {
    const [
        hasMore,
        setHasMore
    ] =
        useState(
            initialHasMore
        )

    const [
        isLoadingOlder,
        setIsLoadingOlder
    ] =
        useState(false)

    const messagesRef =
        useRef(messages)

    const loadingRef =
        useRef(false)

    const lastScrollTopRef =
        useRef(0)

    const pendingRestoreRef =
        useRef<PendingRestore | null>(
            null
        )

    const activeConversationRef =
        useRef(
            conversationId
        )

    useEffect(() => {
        messagesRef.current =
            messages
    }, [messages])

    useEffect(() => {
        if (
            activeConversationRef.current ===
            conversationId
        ) {
            return
        }

        activeConversationRef.current =
            conversationId

        setHasMore(
            initialHasMore
        )

        loadingRef.current =
            false

        lastScrollTopRef.current =
            0

        pendingRestoreRef.current =
            null
    }, [
        conversationId,
        initialHasMore
    ])

    useLayoutEffect(() => {
        const pending =
            pendingRestoreRef.current

        const container =
            containerRef.current

        if (
            !pending ||
            !container
        ) {
            return
        }

        pendingRestoreRef.current =
            null

        const heightDifference =
            container.scrollHeight -
            pending.scrollHeight

        container.scrollTop =
            pending.scrollTop +
            heightDifference

        lastScrollTopRef.current =
            container.scrollTop
    }, [
        containerRef,
        messages
    ])

    useEffect(() => {
        const container =
            containerRef.current

        if (!container) return

        const loadOlder =
            async () => {
                if (
                    loadingRef.current ||
                    !hasMore
                ) {
                    return
                }

                const currentMessages =
                    messagesRef.current

                const oldest =
                    currentMessages[0]

                if (!oldest) return

                loadingRef.current =
                    true

                setIsLoadingOlder(
                    true
                )

                onError("")

                const previousScrollHeight =
                    container.scrollHeight

                const previousScrollTop =
                    container.scrollTop

                try {
                    const result =
                        await getOlderDirectMessages(
                            conversationId,
                            oldest.createdAt,
                            oldest.id
                        )

                    if (
                        result.success ===
                        false
                    ) {
                        onError(
                            result.error
                        )

                        return
                    }

                    setHasMore(
                        result.hasMore
                    )

                    if (
                        result.messages
                            .length ===
                        0
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
                            current
                        ) => {
                            const currentIds =
                                new Set(
                                    current.map(
                                        (
                                            message
                                        ) =>
                                            message.id
                                    )
                                )

                            return [
                                ...result.messages.filter(
                                    (
                                        message
                                    ) =>
                                        !currentIds.has(
                                            message.id
                                        )
                                ),
                                ...current
                            ]
                        }
                    )
                } finally {
                    loadingRef.current =
                        false

                    setIsLoadingOlder(
                        false
                    )
                }
            }

        const handleScroll =
            () => {
                const movingUp =
                    container.scrollTop <
                    lastScrollTopRef.current

                lastScrollTopRef.current =
                    container.scrollTop

                if (
                    movingUp &&
                    container.scrollTop <=
                    220 &&
                    hasMore
                ) {
                    void loadOlder()
                }
            }

        lastScrollTopRef.current =
            container.scrollTop

        container.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true
            }
        )

        return () =>
            container.removeEventListener(
                "scroll",
                handleScroll
            )
    }, [
        containerRef,
        conversationId,
        hasMore,
        onError,
        setMessages
    ])

    return {
        hasMore,
        isLoadingOlder
    }
}

export default useDirectOlderMessages