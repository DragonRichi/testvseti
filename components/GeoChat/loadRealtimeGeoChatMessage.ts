import type { SupabaseClient } from "@supabase/supabase-js"
import type { GeoChatMessage, GeoChatSenderRole } from "@/types/geoChat"

export type RealtimeGeoChatMessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    reply_to_id: string | null
    sender_role: GeoChatSenderRole | null
    created_at: string
    updated_at: string
}

export type RealtimeGeoChatUpdateRow = {
    id: string
    content: string
    reply_to_id: string | null
    sender_role: GeoChatSenderRole | null
    updated_at: string
}

type CachedProfile = {
    username: string
    displayName: string
    avatarUrl: string | null
}

export type GeoChatProfileCache = Map<string, CachedProfile>

export function fillGeoChatProfileCache(cache: GeoChatProfileCache, messages: GeoChatMessage[]) {
    for (const message of messages) {
        cache.set(message.userId, {
            username: message.authorUsername,
            displayName: message.authorDisplayName,
            avatarUrl: message.authorAvatarUrl
        })
    }
}

async function getProfile(supabase: SupabaseClient, userId: string, cache: GeoChatProfileCache) {
    const cached = cache.get(userId)

    if (cached) return cached

    const { data, error } = await supabase.from("profiles").select("username,display_name,avatar_url").eq("id", userId).maybeSingle()

    if (error || !data) {
        console.error("GEO CHAT REALTIME PROFILE ERROR:", error)
        return null
    }

    const profile: CachedProfile = {
        username: data.username,
        displayName: data.display_name ?? data.username,
        avatarUrl: data.avatar_url
    }

    cache.set(userId, profile)

    return profile
}

export async function loadRealtimeGeoChatMessage(supabase: SupabaseClient, row: RealtimeGeoChatMessageRow, currentMessages: GeoChatMessage[], profileCache: GeoChatProfileCache): Promise<GeoChatMessage | null> {
    const author = await getProfile(supabase, row.user_id, profileCache)

    if (!author) return null

    let replyTo: GeoChatMessage["replyTo"] = null

    if (row.reply_to_id) {
        const cachedReply = currentMessages.find((message) => message.id === row.reply_to_id)

        if (cachedReply) {
            replyTo = {
                id: cachedReply.id,
                authorUsername: cachedReply.authorUsername,
                authorDisplayName: cachedReply.authorDisplayName,
                content: cachedReply.content
            }
        } else {
            const { data: replyMessage, error: replyError } = await supabase.from("geo_chat_messages").select("id,user_id,content").eq("id", row.reply_to_id).eq("chat_id", row.chat_id).maybeSingle()

            if (replyError) {
                console.error("GEO CHAT REALTIME REPLY ERROR:", replyError)
                return null
            }

            if (replyMessage) {
                const replyAuthor = await getProfile(supabase, replyMessage.user_id, profileCache)

                if (!replyAuthor) return null

                replyTo = {
                    id: replyMessage.id,
                    authorUsername: replyAuthor.username,
                    authorDisplayName: replyAuthor.displayName,
                    content: replyMessage.content
                }
            }
        }
    }

    return {
        id: row.id,
        chatId: row.chat_id,
        userId: row.user_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorUsername: author.username,
        authorDisplayName: author.displayName,
        authorAvatarUrl: author.avatarUrl,
        replyTo,
        senderRole: row.sender_role ?? null
    }
}

export function applyRealtimeGeoChatUpdate(messages: GeoChatMessage[], row: RealtimeGeoChatUpdateRow) {
    return messages.map((message) => {
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
}

export function applyRealtimeGeoChatDelete(messages: GeoChatMessage[], messageId: string) {
    return messages
        .filter((message) => message.id !== messageId)
        .map((message) => {
            if (message.replyTo?.id !== messageId) return message

            return {
                ...message,
                replyTo: null
            }
        })
}