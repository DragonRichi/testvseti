"use client"

import { getDirectConversations } from "@/actions/getDirectConversations"
import { createClient } from "@/lib/supabase/client"
import type { DirectConversationSummary } from "@/types/directMessages"
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"
import {
    applyInsertedMessageToConversations,
    type DirectMessageInsertPayload
} from "./directConversationListHelpers"

type Options = {
    initialConversations: DirectConversationSummary[]
    currentProfileId: string
}

function useDirectConversationListRealtime({
    initialConversations,
    currentProfileId
}: Options) {
    const [
        conversations,
        setConversations
    ] =
        useState<DirectConversationSummary[]>(
            initialConversations
        )

    const syncTimerRef =
        useRef<number | null>(null)

    const syncInProgressRef =
        useRef(false)

    const syncQueuedRef =
        useRef(false)

    const syncConversations =
        useCallback(async () => {
            if (
                syncInProgressRef.current
            ) {
                syncQueuedRef.current =
                    true

                return
            }

            syncInProgressRef.current =
                true

            try {
                const next =
                    await getDirectConversations()

                setConversations(next)
            } catch (error) {
                console.error(
                    "DIRECT CONVERSATIONS SYNC ERROR:",
                    error
                )
            } finally {
                syncInProgressRef.current =
                    false

                if (
                    syncQueuedRef.current
                ) {
                    syncQueuedRef.current =
                        false

                    void syncConversations()
                }
            }
        }, [])

    const scheduleSync =
        useCallback(() => {
            if (
                syncTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    syncTimerRef.current
                )
            }

            syncTimerRef.current =
                window.setTimeout(
                    () => {
                        syncTimerRef.current =
                            null

                        void syncConversations()
                    },
                    150
                )
        }, [syncConversations])

    useEffect(() => {
        const supabase =
            createClient()

        let disposed = false

        let channel:
            ReturnType<
                typeof supabase.channel
            > | null =
            null

        let reconnectTimer:
            number | null =
            null

        let reconnectAttempt = 0
        let connecting = false

        const scheduleReconnect =
            () => {
                if (
                    disposed ||
                    reconnectTimer !==
                        null
                ) {
                    return
                }

                const delay =
                    Math.min(
                        1000 *
                            2 **
                                reconnectAttempt,
                        8000
                    )

                reconnectAttempt =
                    Math.min(
                        reconnectAttempt +
                            1,
                        4
                    )

                reconnectTimer =
                    window.setTimeout(
                        () => {
                            reconnectTimer =
                                null

                            void connect()
                        },
                        delay
                    )
            }

        const handleInsert = (
            payload:
                DirectMessageInsertPayload
        ) => {
            let found = false

            setConversations(
                (current) => {
                    const result =
                        applyInsertedMessageToConversations(
                            current,
                            payload,
                            currentProfileId
                        )

                    found =
                        result.found

                    return result.conversations
                }
            )

            /*
             * Если это первое сообщение
             * нового direct-диалога,
             * его ещё нет в списке.
             */
            if (!found) {
                scheduleSync()
                return
            }

            /*
             * После мгновенного UI-обновления
             * сверяем unread и сортировку с БД.
             */
            scheduleSync()
        }

        const connect =
            async () => {
                if (
                    disposed ||
                    connecting
                ) {
                    return
                }

                connecting = true

                try {
                    const {
                        data: {
                            session
                        },
                        error:
                            sessionError
                    } =
                        await supabase.auth.getSession()

                    if (disposed) {
                        return
                    }

                    if (
                        sessionError ||
                        !session
                    ) {
                        console.error(
                            "DIRECT CONVERSATIONS REALTIME SESSION ERROR:",
                            sessionError
                        )

                        scheduleReconnect()

                        return
                    }

                    supabase.realtime.setAuth(
                        session.access_token
                    )

                    const previousChannel =
                        channel

                    channel = null

                    if (
                        previousChannel
                    ) {
                        await supabase.removeChannel(
                            previousChannel
                        )
                    }

                    if (disposed) {
                        return
                    }

                    channel =
                        supabase
                            .channel(
                                `direct-conversations:${currentProfileId}:${Date.now()}`
                            )
                            .on(
                                "postgres_changes",
                                {
                                    event:
                                        "INSERT",
                                    schema:
                                        "public",
                                    table:
                                        "messages"
                                },
                                (
                                    payload:
                                        DirectMessageInsertPayload
                                ) => {
                                    handleInsert(
                                        payload
                                    )
                                }
                            )
                            .subscribe(
                                (
                                    status: string
                                ) => {
                                    if (
                                        disposed
                                    ) {
                                        return
                                    }

                                    if (
                                        status ===
                                        "SUBSCRIBED"
                                    ) {
                                        reconnectAttempt =
                                            0

                                        void syncConversations()

                                        return
                                    }

                                    if (
                                        status ===
                                            "CHANNEL_ERROR" ||
                                        status ===
                                            "TIMED_OUT"
                                    ) {
                                        scheduleReconnect()
                                    }
                                }
                            )
                } catch (error) {
                    console.error(
                        "DIRECT CONVERSATIONS REALTIME CONNECT ERROR:",
                        error
                    )

                    scheduleReconnect()
                } finally {
                    connecting = false
                }
            }

        void connect()

        const handleFocus =
            () => {
                void syncConversations()
            }

        const handleVisibility =
            () => {
                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    void syncConversations()
                }
            }

        window.addEventListener(
            "focus",
            handleFocus
        )

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        )

        return () => {
            disposed = true

            window.removeEventListener(
                "focus",
                handleFocus
            )

            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            )

            if (
                syncTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    syncTimerRef.current
                )
            }

            if (
                reconnectTimer !==
                null
            ) {
                window.clearTimeout(
                    reconnectTimer
                )
            }

            if (channel) {
                void supabase.removeChannel(
                    channel
                )
            }
        }
    }, [
        currentProfileId,
        scheduleSync,
        syncConversations
    ])

    return conversations
}

export default useDirectConversationListRealtime