"use client"

import { getGeoChatMessageAttachments } from "@/actions/getGeoChatMessageAttachments"
import type {
    GeoChatMessageAttachment,
    GeoChatMessageAttachmentMap
} from "@/types/geoChatAttachments"
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"

type Options = {
    roomId: string
    messageIds: string[]
    initialAttachments:
        GeoChatMessageAttachmentMap
}

function useGeoChatMessageAttachments({
    roomId,
    messageIds,
    initialAttachments
}: Options) {
    const [
        attachments,
        setAttachments
    ] =
        useState<GeoChatMessageAttachmentMap>(
            () => initialAttachments
        )

    const [isLoading, setIsLoading] =
        useState(false)

    const activeRoomIdRef =
        useRef(roomId)

    const requestIdRef =
        useRef(0)

    const loadedMessageIdsRef =
        useRef(
            new Set(
                Object.keys(
                    initialAttachments
                )
            )
        )

    const messageIdsKey =
        useMemo(
            () =>
                [...messageIds]
                    .sort()
                    .join(","),
            [messageIds]
        )

    const setMessageAttachments =
        useCallback(
            (
                messageId: string,
                nextAttachments:
                    GeoChatMessageAttachment[]
            ) => {
                loadedMessageIdsRef.current.add(
                    messageId
                )

                setAttachments(
                    (current) => ({
                        ...current,
                        [messageId]:
                            nextAttachments
                    })
                )
            },
            []
        )

    const removeMessageAttachments =
        useCallback(
            (
                messageId: string
            ) => {
                loadedMessageIdsRef.current.delete(
                    messageId
                )

                setAttachments(
                    (current) => {
                        if (
                            !current[
                                messageId
                            ]
                        ) {
                            return current
                        }

                        const next = {
                            ...current
                        }

                        delete next[
                            messageId
                        ]

                        return next
                    }
                )
            },
            []
        )

    useEffect(() => {
        if (
            activeRoomIdRef.current ===
            roomId
        ) {
            return
        }

        activeRoomIdRef.current =
            roomId

        requestIdRef.current += 1

        loadedMessageIdsRef.current =
            new Set(
                Object.keys(
                    initialAttachments
                )
            )

        setAttachments(
            initialAttachments
        )

        setIsLoading(false)
    }, [
        initialAttachments,
        roomId
    ])

    useEffect(() => {
        if (
            !roomId ||
            messageIds.length === 0
        ) {
            return
        }

        const missingMessageIds =
            messageIds.filter(
                (messageId) =>
                    !loadedMessageIdsRef
                        .current
                        .has(messageId)
            )

        if (
            missingMessageIds.length ===
            0
        ) {
            return
        }

        let disposed = false

        const requestId =
            ++requestIdRef.current

        const loadAttachments =
            async () => {
                setIsLoading(true)

                try {
                    const result =
                        await getGeoChatMessageAttachments(
                            roomId,
                            missingMessageIds
                        )

                    if (
                        disposed ||
                        requestId !==
                            requestIdRef.current
                    ) {
                        return
                    }

                    if (
                        result.success ===
                        false
                    ) {
                        console.error(
                            "GEO CHAT ATTACHMENTS LOAD ERROR:",
                            result.error
                        )

                        return
                    }

                    setAttachments(
                        (current) => {
                            const next = {
                                ...current
                            }

                            for (
                                const messageId of
                                missingMessageIds
                            ) {
                                if (
                                    messageId in
                                    result.attachments
                                ) {
                                    next[
                                        messageId
                                    ] =
                                        result
                                            .attachments[
                                            messageId
                                        ]
                                } else if (
                                    !(
                                        messageId in
                                        next
                                    )
                                ) {
                                    next[
                                        messageId
                                    ] = []
                                }
                            }

                            return next
                        }
                    )

                    for (
                        const messageId of
                        missingMessageIds
                    ) {
                        loadedMessageIdsRef.current.add(
                            messageId
                        )
                    }
                } catch (error) {
                    console.error(
                        "GEO CHAT ATTACHMENTS LOAD ERROR:",
                        error
                    )
                } finally {
                    if (
                        !disposed &&
                        requestId ===
                            requestIdRef.current
                    ) {
                        setIsLoading(
                            false
                        )
                    }
                }
            }

        void loadAttachments()

        return () => {
            disposed = true
        }
    }, [
        messageIdsKey,
        roomId
    ])

    return {
        attachments,
        isLoading,
        setMessageAttachments,
        removeMessageAttachments
    }
}

export default useGeoChatMessageAttachments