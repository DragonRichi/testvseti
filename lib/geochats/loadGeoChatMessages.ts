import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { createClient } from "@/lib/supabase/server"
import type { GeoChatMessage, GeoChatSenderRole } from "@/types/geoChat"

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

type MessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    author_username: string
    author_display_name: string | null
    author_avatar_url: string | null
    reply_to_id: string | null
    reply_author_username: string | null
    reply_author_display_name: string | null
    reply_content: string | null
}

function normalizeSenderRole(value: string | null): GeoChatSenderRole | null {
    if (value === "admin") return "admin"
    if (value === "moderator") return "moderator"

    return null
}

export async function loadGeoChatMessages(supabase: ServerSupabaseClient, chatId: string) {
    const { data, error } = await supabase.rpc("get_geo_chat_messages", {
        p_chat_id: chatId,
        p_limit: 100
    })

    if (error) {
        console.error("GEO CHAT MESSAGES LOAD ERROR:", error)
        throw new Error("Не удалось загрузить сообщения")
    }

    const rows = (data ?? []) as MessageRow[]

    if (rows.length === 0) return []

    const messageIds = rows.map((message) => message.id)

    const { data: roleRows, error: roleError } = await supabaseAdmin
        .from("geo_chat_messages")
        .select("id,sender_role")
        .in("id", messageIds)

    if (roleError) {
        console.error("GEO CHAT MESSAGE ROLES LOAD ERROR:", roleError)
    }

    const rolesById = new Map((roleRows ?? []).map((message) => [message.id, normalizeSenderRole(message.sender_role)]))

    const messages: GeoChatMessage[] = rows.map((message) => ({
        id: message.id,
        chatId: message.chat_id,
        userId: message.user_id,
        content: message.content,
        createdAt: message.created_at,
        updatedAt: message.updated_at,
        authorUsername: message.author_username,
        authorDisplayName: message.author_display_name ?? message.author_username,
        authorAvatarUrl: message.author_avatar_url,
        replyTo: message.reply_to_id && message.reply_author_username && message.reply_content ? {
            id: message.reply_to_id,
            authorUsername: message.reply_author_username,
            authorDisplayName: message.reply_author_display_name ?? message.reply_author_username,
            content: message.reply_content
        } : null,
        senderRole: rolesById.get(message.id) ?? null
    }))

    return messages
}