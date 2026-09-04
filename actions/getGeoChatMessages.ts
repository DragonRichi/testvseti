"use server"

import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessage } from "@/types/geoChat"

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
}

type Result =
    | {
        success: true
        messages: GeoChatMessage[]
    }
    | {
        success: false
        error: string
    }

export async function getGeoChatMessages(chatId: string): Promise<Result> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const { data: canAccess, error: accessError } = await supabase.rpc("can_access_geo_chat", {
        p_chat_id: chatId
    })

    if (accessError) {
        console.error("GEO CHAT ACCESS ERROR:", accessError)

        return {
            success: false,
            error: "Не удалось проверить доступ к геочату"
        }
    }

    if (!canAccess) {
        return {
            success: false,
            error: "Вы находитесь вне зоны этого геочата"
        }
    }

    const { data, error } = await supabase.rpc("get_geo_chat_messages", {
        p_chat_id: chatId,
        p_limit: 100
    })

    if (error) {
        console.error("GEO CHAT MESSAGES REFRESH ERROR:", error)

        return {
            success: false,
            error: "Не удалось обновить сообщения"
        }
    }

    const messages: GeoChatMessage[] = ((data ?? []) as MessageRow[]).map((message) => ({
        id: message.id,
        chatId: message.chat_id,
        userId: message.user_id,
        content: message.content,
        createdAt: message.created_at,
        updatedAt: message.updated_at,
        authorUsername: message.author_username,
        authorDisplayName: message.author_display_name ?? message.author_username,
        authorAvatarUrl: message.author_avatar_url
    }))

    return {
        success: true,
        messages
    }
}