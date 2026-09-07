"use client"

import { getGeoChatMessages } from "@/actions/getGeoChatMessages"
import { createClient } from "@/lib/supabase/client"
import type { GeoChatMessage, GeoChatSenderRole } from "@/types/geoChat"
import { useEffect, useRef, useState } from "react"
import { loadRealtimeGeoChatMessage, RealtimeGeoChatMessageRow } from "./loadRealtimeGeoChatChatMessage"


type Options = {
    roomId: string
    initialMessages: GeoChatMessage[]
    isNearBottom: () => boolean
    scrollToBottom: (behavior?: ScrollBehavior) => void
}

function useGeoChatRealtime({ roomId, initialMessages, isNearBottom, scrollToBottom }: Options) {
    const [messages, setMessages] = useState<GeoChatMessage[]>(initialMessages)
    const activeRoomIdRef = useRef(roomId)

    useEffect(() => {
        if (activeRoomIdRef.current === roomId) return

        activeRoomIdRef.current = roomId
        setMessages(initialMessages)
    }, [initialMessages, roomId])

    useEffect(() => {
        const supabase = createClient()
        const mountedAt = Date.now()

        let channel: ReturnType<typeof supabase.channel> | null = null
        let disposed = false
        let subscribed = false
        let reconnectTimer: number | null = null
        let reconnectAttempt = 0
        let syncInProgress = false

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

                setMessages(result.messages)
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
            if (disposed) return

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

                if (channel) {
                    await supabase.removeChannel(channel)
                }

                if (disposed) return

                const nextChannel = supabase
                    .channel(`geo-chat:${roomId}:${Date.now()}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "geo_chat_messages",
                            filter: `chat_id=eq.${roomId}`
                        },
                        async (payload) => {
                            const row = payload.new as RealtimeGeoChatMessageRow
                            const shouldScroll = isNearBottom()
                            const newMessage = await loadRealtimeGeoChatMessage(supabase, row)

                            if (!newMessage) {
                                void syncMessages()
                                return
                            }

                            setMessages((currentMessages) => {
                                if (currentMessages.some((message) => message.id === newMessage.id)) return currentMessages

                                return [...currentMessages, newMessage]
                            })

                            if (shouldScroll) {
                                scrollToBottom()
                            }
                        }
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "UPDATE",
                            schema: "public",
                            table: "geo_chat_messages",
                            filter: `chat_id=eq.${roomId}`
                        },
                        (payload) => {
                            const row = payload.new as {
                                id: string
                                content: string
                                reply_to_id: string | null
                                sender_role: GeoChatSenderRole | null
                                updated_at: string
                            }

                            setMessages((currentMessages) =>
                                currentMessages.map((message) => {
                                    let nextMessage = message

                                    if (message.id === row.id) {
                                        nextMessage = {
                                            ...nextMessage,
                                            content: row.content,
                                            updatedAt: row.updated_at,
                                            replyTo: row.reply_to_id === null ? null : nextMessage.replyTo,
                                            senderRole: row.sender_role ?? null
                                        }
                                    }

                                    if (nextMessage.replyTo?.id === row.id) {
                                        nextMessage = {
                                            ...nextMessage,
                                            replyTo: {
                                                ...nextMessage.replyTo,
                                                content: row.content
                                            }
                                        }
                                    }

                                    return nextMessage
                                })
                            )
                        }
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "DELETE",
                            schema: "public",
                            table: "geo_chat_messages"
                        },
                        (payload) => {
                            const row = payload.old as {
                                id?: string
                            }

                            if (!row.id) {
                                void syncMessages()
                                return
                            }

                            setMessages((currentMessages) =>
                                currentMessages
                                    .filter((message) => message.id !== row.id)
                                    .map((message) => {
                                        if (message.replyTo?.id !== row.id) return message

                                        return {
                                            ...message,
                                            replyTo: null
                                        }
                                    })
                            )
                        }
                    )

                channel = nextChannel

                nextChannel.subscribe((status, realtimeError) => {
                    if (disposed || channel !== nextChannel) return

                    if (process.env.NODE_ENV === "development") {
                        console.log("GEO CHAT REALTIME STATUS:", status, realtimeError ?? "")
                    }

                    if (status === "SUBSCRIBED") {
                        subscribed = true
                        reconnectAttempt = 0
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
            }
        }

        const recover = () => {
            if (disposed) return
            if (Date.now() - mountedAt < 5000) return

            if (!subscribed) {
                void connect()
                return
            }

            void syncMessages()
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                recover()
            }
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.access_token) {
                supabase.realtime.setAuth(session.access_token)
            }
        })

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("online", recover)
        window.addEventListener("focus", recover)

        void connect()

        return () => {
            disposed = true

            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer)
            }

            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("online", recover)
            window.removeEventListener("focus", recover)

            authListener.subscription.unsubscribe()

            const currentChannel = channel
            channel = null

            if (currentChannel) {
                void supabase.removeChannel(currentChannel)
            }
        }
    }, [isNearBottom, roomId, scrollToBottom])

    return {
        messages,
        setMessages
    }
}

export default useGeoChatRealtime