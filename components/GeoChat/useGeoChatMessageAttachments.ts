"use client"

import { getGeoChatMessageAttachments } from "@/actions/getGeoChatMessageAttachments"
import type { GeoChatMessageAttachmentMap } from "@/types/geoChatAttachments"
import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"

type Options = {
    roomId: string
    messageIds: string[]
    initialAttachments?:
    GeoChatMessageAttachmentMap
}

const REFRESH_INTERVAL_MS =
    30 * 60 * 1000

function useGeoChatMessageAttachments({
    roomId,
    messageIds,
    initialAttachments = {}
}: Options) {
    const [
        attachments,
        setAttachments
    ] =
        useState<GeoChatMessageAttachmentMap>(
            () =>
                initialAttachments
        )

    const [
        isLoading,
        setIsLoading
    ] =
        useState(false)

    const requestIdRef =
        useRef(0)

    const activeRoomIdRef =
        useRef(roomId)

    const messageIdsKey =
        useMemo(
            () =>
                [...messageIds]
                    .sort()
                    .join(","),
            [messageIds]
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

        setAttachments(
            initialAttachments
        )
    }, [
        initialAttachments,
        roomId
    ])

    useEffect(() => {
        if (
            !roomId ||
            messageIds.length === 0
        ) {
            setAttachments(
                initialAttachments
            )

            setIsLoading(false)
            return
        }

        let disposed = false

        const loadAttachments =
            async (
                background = false
            ) => {
                const requestId =
                    ++requestIdRef.current

                if (!background) {
                    setIsLoading(true)
                }

                try {
                    const result =
                        await getGeoChatMessageAttachments(
                            roomId,
                            messageIds
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
                        result.attachments
                    )
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

        const hasInitialAttachments =
            Object.keys(
                initialAttachments
            ).length > 0

        void loadAttachments(
            hasInitialAttachments
        )

        const refreshTimer =
            window.setInterval(
                () => {
                    void loadAttachments(
                        true
                    )
                },
                REFRESH_INTERVAL_MS
            )

        return () => {
            disposed = true

            window.clearInterval(
                refreshTimer
            )
        }
    }, [
        roomId,
        messageIdsKey
    ])

    return {
        attachments,
        isLoading
    }
}

export default useGeoChatMessageAttachments