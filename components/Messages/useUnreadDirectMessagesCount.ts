"use client"

import { getDirectConversations } from "@/actions/getDirectConversations"
import { DIRECT_MESSAGES_UNREAD_CHANGED } from "@/lib/messages/directMessageEvents"
import { createClient } from "@/lib/supabase/client"
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"

function useUnreadDirectMessagesCount(
    profileId: string | null
) {
    const [unreadCount, setUnreadCount] =
        useState(0)

    const syncTimerRef =
        useRef<number | null>(null)

    const syncInProgressRef =
        useRef(false)

    const syncQueuedRef =
        useRef(false)

    const mountedRef =
        useRef(true)

    useEffect(() => {
        mountedRef.current = true

        return () => {
            mountedRef.current = false
        }
    }, [])

    const syncCount =
        useCallback(async () => {
            if (!profileId) {
                setUnreadCount(0)
                return
            }

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
                const conversations =
                    await getDirectConversations()

                if (
                    !mountedRef.current
                ) {
                    return
                }

                const total =
                    conversations.reduce(
                        (
                            sum,
                            conversation
                        ) =>
                            sum +
                            conversation.unreadCount,
                        0
                    )

                setUnreadCount(total)
            } catch (error) {
                console.error(
                    "DIRECT UNREAD COUNT ERROR:",
                    error
                )
            } finally {
                syncInProgressRef.current =
                    false

                if (
                    syncQueuedRef.current &&
                    mountedRef.current
                ) {
                    syncQueuedRef.current =
                        false

                    void syncCount()
                }
            }
        }, [profileId])

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

                        void syncCount()
                    },
                    150
                )
        }, [syncCount])

    useEffect(() => {
        if (!profileId) {
            setUnreadCount(0)
            return
        }

        const supabase =
            createClient()

        let disposed =
            false

        let channel:
            ReturnType<
                typeof supabase.channel
            > | null =
            null

        let reconnectTimer:
            number | null =
            null

        let reconnectAttempt =
            0

        const scheduleReconnect =
            () => {
                if (
                    disposed ||
                    reconnectTimer !== null
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
                        reconnectAttempt + 1,
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

        const connect =
            async () => {
                const {
                    data: {
                        session
                    },
                    error
                } =
                    await supabase.auth.getSession()

                if (disposed) {
                    return
                }

                if (
                    error ||
                    !session
                ) {
                    scheduleReconnect()
                    return
                }

                supabase.realtime.setAuth(
                    session.access_token
                )

                const previous =
                    channel

                channel = null

                if (previous) {
                    await supabase.removeChannel(
                        previous
                    )
                }

                if (disposed) {
                    return
                }

                channel =
                    supabase
                        .channel(
                            `direct-unread:${profileId}:${Date.now()}`
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
                            () => {
                                scheduleSync()
                            }
                        )
                        .on(
                            "postgres_changes",
                            {
                                event:
                                    "DELETE",
                                schema:
                                    "public",
                                table:
                                    "messages"
                            },
                            () => {
                                scheduleSync()
                            }
                        )
                        .subscribe(
                            (
                                status: string
                            ) => {
                                if (disposed) {
                                    return
                                }

                                if (
                                    status ===
                                    "SUBSCRIBED"
                                ) {
                                    reconnectAttempt =
                                        0

                                    scheduleSync()
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
            }

        const handleUnreadChanged =
            () => {
                scheduleSync()
            }

        const handleVisibility =
            () => {
                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    scheduleSync()
                }
            }

        scheduleSync()
        void connect()

        window.addEventListener(
            DIRECT_MESSAGES_UNREAD_CHANGED,
            handleUnreadChanged
        )

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        )

        return () => {
            disposed = true

            window.removeEventListener(
                DIRECT_MESSAGES_UNREAD_CHANGED,
                handleUnreadChanged
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

                syncTimerRef.current =
                    null
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
        profileId,
        scheduleSync
    ])

    return unreadCount
}

export default useUnreadDirectMessagesCount