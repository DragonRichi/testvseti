"use client"

import { getGeoChatMessageReactions } from "@/actions/getGeoChatMessageReactions"
import { toggleGeoChatMessageReaction } from "@/actions/toggleGeoChatMessageReaction"
import { createClient } from "@/lib/supabase/client"
import type { GeoChatMessage } from "@/types/geoChat"
import type {
    GeoChatMessageReaction,
    GeoChatMessageReactionMap
} from "@/types/geoChatReactions"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type ReactionRealtimeRow = {
    message_id?: string
}

type InsertReactionPayload = {
    new: ReactionRealtimeRow
}

type DeleteReactionPayload = {
    old: ReactionRealtimeRow
}

function createReactionMap(
    messageIds: string[],
    reactions: GeoChatMessageReaction[]
): GeoChatMessageReactionMap {
    const nextMap: GeoChatMessageReactionMap = {}

    for (const messageId of messageIds) {
        nextMap[messageId] = []
    }

    for (const reaction of reactions) {
        const current = nextMap[reaction.messageId] ?? []

        nextMap[reaction.messageId] = [
            ...current,
            reaction
        ]
    }

    return nextMap
}

function useGeoChatMessageReactions(
    messages: GeoChatMessage[],
    onError: (message: string) => void
) {
    const [reactionsByMessage, setReactionsByMessage] =
        useState<GeoChatMessageReactionMap>({})

    const [pendingKeys, setPendingKeys] =
        useState<Set<string>>(new Set())

    const messageIds = useMemo(
        () => messages.map((message) => message.id),
        [messages]
    )

    const messageIdsKey = messageIds.join("|")

    const messageIdsRef = useRef<Set<string>>(new Set())
    const pendingKeysRef = useRef<Set<string>>(new Set())
    const reloadTimersRef = useRef<Map<string, number>>(new Map())

    useEffect(() => {
        messageIdsRef.current = new Set(messageIds)
    }, [messageIdsKey])

    const loadReactions = useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return

            try {
                const result = await getGeoChatMessageReactions(ids)

                if (result.success === false) {
                    onError(result.error)
                    return
                }

                const resultMap = createReactionMap(
                    ids,
                    result.reactions
                )

                setReactionsByMessage((current) => ({
                    ...current,
                    ...resultMap
                }))
            } catch (error) {
                console.error(
                    "GEO CHAT REACTIONS LOAD ERROR:",
                    error
                )

                onError("Не удалось загрузить реакции")
            }
        },
        [onError]
    )

    useEffect(() => {
        if (messageIds.length === 0) {
            setReactionsByMessage({})
            return
        }

        void loadReactions(messageIds)
    }, [loadReactions, messageIdsKey])

    const scheduleMessageReload = useCallback(
        (messageId: string) => {
            if (!messageIdsRef.current.has(messageId)) return

            const existingTimer =
                reloadTimersRef.current.get(messageId)

            if (existingTimer !== undefined) {
                window.clearTimeout(existingTimer)
            }

            const timer = window.setTimeout(() => {
                reloadTimersRef.current.delete(messageId)

                void loadReactions([messageId])
            }, 80)

            reloadTimersRef.current.set(
                messageId,
                timer
            )
        },
        [loadReactions]
    )

    useEffect(() => {
        const supabase = createClient()

        let disposed = false
        let channel: ReturnType<typeof supabase.channel> | null = null

        const connect = async () => {
            const {
                data: { session },
                error
            } = await supabase.auth.getSession()

            if (disposed) return

            if (error || !session) {
                console.error(
                    "GEO CHAT REACTIONS REALTIME SESSION ERROR:",
                    error
                )

                return
            }

            supabase.realtime.setAuth(
                session.access_token
            )

            const nextChannel = supabase
                .channel(`geo-chat-reactions:${Date.now()}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "geo_chat_message_reactions"
                    },
                    (payload: InsertReactionPayload) => {
                        const messageId =
                            payload.new.message_id

                        if (messageId) {
                            scheduleMessageReload(
                                messageId
                            )
                        }
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "DELETE",
                        schema: "public",
                        table: "geo_chat_message_reactions"
                    },
                    (payload: DeleteReactionPayload) => {
                        const messageId =
                            payload.old.message_id

                        if (messageId) {
                            scheduleMessageReload(
                                messageId
                            )
                        }
                    }
                )

            channel = nextChannel

            nextChannel.subscribe((status: string) => {
                if (
                    process.env.NODE_ENV === "development"
                ) {
                    console.log(
                        "GEO CHAT REACTIONS REALTIME:",
                        status
                    )
                }
            })
        }

        void connect()

        return () => {
            disposed = true

            for (
                const timer
                of reloadTimersRef.current.values()
            ) {
                window.clearTimeout(timer)
            }

            reloadTimersRef.current.clear()

            if (channel) {
                void supabase.removeChannel(channel)
            }
        }
    }, [scheduleMessageReload])

    const toggleReaction = useCallback(
        async (
            messageId: string,
            emoji: string
        ) => {
            const pendingKey =
                `${messageId}:${emoji}`

            if (
                pendingKeysRef.current.has(
                    pendingKey
                )
            ) {
                return
            }

            pendingKeysRef.current.add(
                pendingKey
            )

            setPendingKeys(
                new Set(pendingKeysRef.current)
            )

            try {
                const result =
                    await toggleGeoChatMessageReaction(
                        messageId,
                        emoji
                    )

                if (result.success === false) {
                    onError(result.error)
                    return
                }

                setReactionsByMessage(
                    (current) => ({
                        ...current,
                        [messageId]:
                            result.reactions
                    })
                )
            } catch (error) {
                console.error(
                    "GEO CHAT REACTION ERROR:",
                    error
                )

                onError(
                    "Не удалось изменить реакцию"
                )
            } finally {
                pendingKeysRef.current.delete(
                    pendingKey
                )

                setPendingKeys(
                    new Set(
                        pendingKeysRef.current
                    )
                )
            }
        },
        [onError]
    )

    return {
        reactionsByMessage,
        pendingKeys,
        toggleReaction
    }
}

export default useGeoChatMessageReactions