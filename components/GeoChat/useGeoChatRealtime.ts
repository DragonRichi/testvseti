"use client"

import { getGeoChatMessages } from "@/actions/getGeoChatMessages"
import { createClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import type { GeoChatMessage } from "@/types/geoChat"
import { useEffect, useRef, useState } from "react"
import {
    applyRealtimeGeoChatDelete,
    applyRealtimeGeoChatUpdate,
    fillGeoChatProfileCache,
    GeoChatProfileCache,
    loadRealtimeGeoChatMessage,
    RealtimeGeoChatMessageRow,
    RealtimeGeoChatUpdateRow
} from "./loadRealtimeGeoChatMessage"

type Options = {
    roomId: string
    initialMessages: GeoChatMessage[]
    isNearBottom: () => boolean
    scrollToBottom: (behavior?: ScrollBehavior) => void
}

type RealtimeInsertPayload = {
    new: RealtimeGeoChatMessageRow
}

type RealtimeUpdatePayload = {
    new: RealtimeGeoChatUpdateRow
}

type RealtimeDeletePayload = {
    old: {
        id?: string
    }
}

const BACKGROUND_SYNC_AFTER_MS = 30000
const FOREGROUND_RECONNECT_AFTER_MS = 3000

function useGeoChatRealtime({ roomId, initialMessages, isNearBottom, scrollToBottom }: Options) {
    const [messages, setMessages] = useState<GeoChatMessage[]>(initialMessages)
    const activeRoomIdRef = useRef(roomId)
    const messagesRef = useRef(initialMessages)
    const profileCacheRef = useRef<GeoChatProfileCache>(new Map())

    useEffect(() => {
        messagesRef.current = messages
        fillGeoChatProfileCache(profileCacheRef.current, messages)
    }, [messages])

    useEffect(() => {
        if (activeRoomIdRef.current === roomId) return

        activeRoomIdRef.current = roomId
        messagesRef.current = initialMessages
        profileCacheRef.current.clear()
        fillGeoChatProfileCache(profileCacheRef.current, initialMessages)
        setMessages(initialMessages)
    }, [initialMessages, roomId])

    useEffect(() => {
        const supabase = createClient()

        let channel: ReturnType<typeof supabase.channel> | null = null
        let disposed = false
        let subscribed = false
        let hasSubscribedOnce = false
        let connecting = false
        let reconnectTimer: number | null = null
        let recoveryInProgress = false
        let lastRecoveryAt = 0
        let reconnectAttempt = 0
        let syncInProgress = false
        let hiddenAt: number | null = document.visibilityState === "hidden" ? Date.now() : null

        const replaceMessages = (nextMessages: GeoChatMessage[]) => {
            messagesRef.current = nextMessages
            fillGeoChatProfileCache(profileCacheRef.current, nextMessages)
            setMessages(nextMessages)
        }

        const syncMessages = async () => {
            if (disposed || syncInProgress) return

            syncInProgress = true

            try {
                const result = await getGeoChatMessages(roomId)

                if (disposed) return

                if (result.success === false) {
                    console.error("GEO CHAT REALTIME SYNC ERROR:", result.error)
                    return
                }

                replaceMessages(result.messages)
            } catch (error) {
                console.error("GEO CHAT REALTIME SYNC ERROR:", error)
            } finally {
                syncInProgress = false
            }
        }

        const scheduleReconnect = () => {
            if (disposed || reconnectTimer !== null) return

            subscribed = false

            const delay = Math.min(1000 * 2 ** reconnectAttempt, 8000)
            reconnectAttempt = Math.min(reconnectAttempt + 1, 4)

            reconnectTimer = window.setTimeout(() => {
                reconnectTimer = null
                void connect()
            }, delay)
        }

        const connect = async () => {
            if (disposed || connecting) return

            connecting = true

            try {
                const {
                    data: { session },
                    error: sessionError
                } = await supabase.auth.getSession()

                if (disposed) return

                if (sessionError || !session) {
                    console.error("GEO CHAT REALTIME SESSION ERROR:", sessionError)
                    scheduleReconnect()
                    return
                }

                supabase.realtime.setAuth(session.access_token)

                const previousChannel = channel
                channel = null
                subscribed = false

                if (previousChannel) {
                    await supabase.removeChannel(previousChannel)
                }

                if (disposed) return

                const nextChannel = supabase
                    .channel(`geo-chat:${roomId}:${Date.now()}`)
                    .on("postgres_changes", { event: "INSERT", schema: "public", table: "geo_chat_messages", filter: `chat_id=eq.${roomId}` }, async (payload: RealtimeInsertPayload) => {
                        const row = payload.new
                        const shouldScroll = isNearBottom()
                        const newMessage = await loadRealtimeGeoChatMessage(supabase, row, messagesRef.current, profileCacheRef.current)

                        if (!newMessage) {
                            void syncMessages()
                            return
                        }

                        setMessages((currentMessages) => {
                            if (currentMessages.some((message) => message.id === newMessage.id)) return currentMessages

                            const nextMessages = [...currentMessages, newMessage]
                            messagesRef.current = nextMessages
                            return nextMessages
                        })

                        if (shouldScroll) scrollToBottom()
                    })
                    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "geo_chat_messages", filter: `chat_id=eq.${roomId}` }, (payload: RealtimeUpdatePayload) => {
                        const row = payload.new

                        setMessages((currentMessages) => {
                            const nextMessages = applyRealtimeGeoChatUpdate(currentMessages, row)
                            messagesRef.current = nextMessages
                            return nextMessages
                        })
                    })
                    .on("postgres_changes", { event: "DELETE", schema: "public", table: "geo_chat_messages" }, (payload: RealtimeDeletePayload) => {
                        const row = payload.old
                        const deletedMessageId = row.id

                        if (!deletedMessageId) {
                            void syncMessages()
                            return
                        }

                        setMessages((currentMessages) => {
                            const nextMessages = applyRealtimeGeoChatDelete(currentMessages, deletedMessageId)
                            messagesRef.current = nextMessages
                            return nextMessages
                        })
                    })

                channel = nextChannel

                nextChannel.subscribe((status: string, realtimeError?: Error) => {
                    if (disposed || channel !== nextChannel) return

                    if (process.env.NODE_ENV === "development") {
                        console.log("GEO CHAT REALTIME STATUS:", status, realtimeError ?? "")
                    }

                    if (status === "SUBSCRIBED") {
                        const shouldRecoverMessages = hasSubscribedOnce

                        subscribed = true
                        hasSubscribedOnce = true
                        reconnectAttempt = 0

                        if (shouldRecoverMessages) void syncMessages()
                        return
                    }

                    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
                        console.error("GEO CHAT REALTIME CONNECTION LOST:", status, realtimeError ?? "")
                        scheduleReconnect()
                    }
                })
            } catch (error) {
                console.error("GEO CHAT REALTIME CONNECT ERROR:", error)
                scheduleReconnect()
            } finally {
                connecting = false
            }
        }

        const recoverRealtime = async () => {
            if (disposed || recoveryInProgress) return

            const now = Date.now()

            if (now - lastRecoveryAt < 1000) return

            lastRecoveryAt = now
            recoveryInProgress = true

            try {
                if (reconnectTimer !== null) {
                    window.clearTimeout(reconnectTimer)
                    reconnectTimer = null
                }

                void syncMessages()

                const previousChannel = channel
                channel = null
                subscribed = false
                reconnectAttempt = 0

                if (previousChannel) {
                    await supabase.removeChannel(previousChannel)
                }

                if (disposed) return

                if (connecting) {
                    scheduleReconnect()
                    return
                }

                await connect()
            } catch (error) {
                console.error("GEO CHAT REALTIME RECOVERY ERROR:", error)
                subscribed = false
                scheduleReconnect()
            } finally {
                recoveryInProgress = false
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                hiddenAt = Date.now()
                return
            }

            const hiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt
            hiddenAt = null

            if (!subscribed || hiddenFor >= FOREGROUND_RECONNECT_AFTER_MS) {
                void recoverRealtime()
                return
            }

            if (hiddenFor >= BACKGROUND_SYNC_AFTER_MS) {
                void syncMessages()
            }
        }

        const handleFocus = () => {
            if (!subscribed) void recoverRealtime()
        }

        const handleOnline = () => {
            void recoverRealtime()
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.access_token) supabase.realtime.setAuth(session.access_token)
        })

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("online", handleOnline)
        window.addEventListener("focus", handleFocus)

        void connect()

        return () => {
            disposed = true
            subscribed = false

            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer)
                reconnectTimer = null
            }

            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("focus", handleFocus)
            authListener.subscription.unsubscribe()

            const currentChannel = channel
            channel = null

            if (currentChannel) void supabase.removeChannel(currentChannel)
        }
    }, [isNearBottom, roomId, scrollToBottom])

    return {
        messages,
        setMessages
    }
}

export default useGeoChatRealtime
