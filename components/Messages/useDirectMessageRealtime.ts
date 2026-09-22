"use client"

import { getDirectMessages } from "@/actions/getDirectMessages"
import { markDirectConversationRead } from "@/actions/markDirectConversationRead"
import { createClient } from "@/lib/supabase/client"
import type { DirectMessage } from "@/types/directMessages"
import { useEffect, useRef, useState } from "react"
import { mergeDirectRecentMessages } from "./mergeDirectRecentMessages"

type Options = {
    conversationId: string
    initialMessages: DirectMessage[]
}

type DeleteMessagePayload = {
    old: Record<string, unknown>
}

function useDirectMessageRealtime({
    conversationId,
    initialMessages
}: Options) {
    const [messages, setMessages] = useState<DirectMessage[]>(initialMessages)

    const messagesRef = useRef<DirectMessage[]>(initialMessages)
    const activeConversationRef = useRef(conversationId)

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    useEffect(() => {
        if (activeConversationRef.current === conversationId) return

        activeConversationRef.current = conversationId
        messagesRef.current = initialMessages
        setMessages(initialMessages)
    }, [conversationId, initialMessages])

    useEffect(() => {
        const supabase = createClient()

        let disposed = false
        let channel: ReturnType<typeof supabase.channel> | null = null
        let syncInProgress = false
        let syncQueued = false

        const markRead = () => {
            if (document.visibilityState !== "visible") return

            void markDirectConversationRead(conversationId)
        }

        const syncRecent = async () => {
            if (disposed) return

            if (syncInProgress) {
                syncQueued = true
                return
            }

            syncInProgress = true

            try {
                const result = await getDirectMessages(conversationId)

                if (disposed || result.success === false) return

                setMessages((current) => {
                    const next = mergeDirectRecentMessages(
                        current,
                        result.messages
                    )

                    messagesRef.current = next

                    return next
                })

                markRead()
            } catch (error) {
                console.error(
                    "DIRECT MESSAGE REALTIME SYNC ERROR:",
                    error
                )
            } finally {
                syncInProgress = false

                if (syncQueued && !disposed) {
                    syncQueued = false
                    void syncRecent()
                }
            }
        }

        const connect = async () => {
            const {
                data: { session },
                error: sessionError
            } = await supabase.auth.getSession()

            if (disposed) return

            if (sessionError) {
                console.error(
                    "DIRECT MESSAGE REALTIME SESSION ERROR:",
                    sessionError
                )
                return
            }

            if (!session) return

            supabase.realtime.setAuth(session.access_token)

            channel = supabase
                .channel(`direct-messages:${conversationId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    () => {
                        void syncRecent()
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    () => {
                        void syncRecent()
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "DELETE",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload: DeleteMessagePayload) => {
                        const deletedId =
                            typeof payload.old.id === "string"
                                ? payload.old.id
                                : null

                        if (!deletedId) {
                            void syncRecent()
                            return
                        }

                        setMessages((current) => {
                            const next = current.filter(
                                (message) => message.id !== deletedId
                            )

                            messagesRef.current = next

                            return next
                        })
                    }
                )
                .subscribe()
        }

        void connect()
        markRead()

        const handleVisible = () => {
            if (document.visibilityState !== "visible") return

            void syncRecent()
            markRead()
        }

        const handleFocus = () => {
            void syncRecent()
            markRead()
        }

        document.addEventListener(
            "visibilitychange",
            handleVisible
        )

        window.addEventListener(
            "focus",
            handleFocus
        )

        return () => {
            disposed = true

            document.removeEventListener(
                "visibilitychange",
                handleVisible
            )

            window.removeEventListener(
                "focus",
                handleFocus
            )

            if (channel) {
                void supabase.removeChannel(channel)
            }
        }
    }, [conversationId])

    return {
        messages,
        setMessages
    }
}

export default useDirectMessageRealtime