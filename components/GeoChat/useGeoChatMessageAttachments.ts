"use client"

import { getGeoChatMessageAttachments } from "@/actions/getGeoChatMessageAttachments"
import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"
import { useEffect, useMemo, useRef, useState } from "react"

type Options = {
    roomId: string
    messageIds: string[]
}

export type GeoChatMessageAttachmentMap =
    Record<
        string,
        GeoChatMessageAttachment[]
    >

const REFRESH_INTERVAL_MS =
    30 * 60 * 1000

function useGeoChatMessageAttachments({
    roomId,
    messageIds
}: Options) {
    const [
        attachments,
        setAttachments
    ] =
        useState<GeoChatMessageAttachmentMap>(
            {}
        )

    const [isLoading, setIsLoading] =
        useState(false)

    const requestIdRef =
        useRef(0)

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
            !roomId ||
            messageIds.length === 0
        ) {
            setAttachments({})
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
                        setIsLoading(false)
                    }
                }
            }

        void loadAttachments()

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