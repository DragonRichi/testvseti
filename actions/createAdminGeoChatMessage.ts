"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type RpcStatus = "ok" | "unauthorized" | "empty" | "too_long" | "chat_not_found" | "reply_not_found"

type RpcRow = {
    status: RpcStatus
    id: string | null
    chat_id: string | null
    user_id: string | null
    content: string | null
    reply_to_id: string | null
    sender_role: string | null
    created_at: string | null
    updated_at: string | null
}

type Result =
    | {
        success: true
        message: {
            id: string
            chat_id: string
            user_id: string
            content: string
            reply_to_id: string | null
            sender_role: "admin"
            created_at: string
            updated_at: string
        }
    }
    | {
        success: false
        error: string
    }

export async function createAdminGeoChatMessage(chatId: string, content: string, replyToId: string | null = null): Promise<Result> {
    const normalizedContent = content.trim()

    if (!normalizedContent) {
        return {
            success: false,
            error: "Введите сообщение"
        }
    }

    if (normalizedContent.length > 4000) {
        return {
            success: false,
            error: "Сообщение не должно превышать 4000 символов"
        }
    }

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

    const adminMode = await hasGeoChatAdminMode()

    if (!adminMode) {
        return {
            success: false,
            error: "Режим администратора не активен"
        }
    }

    const { data, error } = await supabaseAdmin.rpc("create_admin_geo_chat_message", {
        p_chat_id: chatId,
        p_user_id: user.id,
        p_content: normalizedContent,
        p_reply_to_id: replyToId
    })

    if (error) {
        console.error("ADMIN GEO CHAT MESSAGE CREATE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    if (row.status === "unauthorized") {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    if (row.status === "empty") {
        return {
            success: false,
            error: "Введите сообщение"
        }
    }

    if (row.status === "too_long") {
        return {
            success: false,
            error: "Сообщение не должно превышать 4000 символов"
        }
    }

    if (row.status === "chat_not_found") {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    if (row.status === "reply_not_found") {
        return {
            success: false,
            error: "Исходное сообщение не найдено"
        }
    }

    if (!row.id || !row.chat_id || !row.user_id || row.content === null || !row.created_at || !row.updated_at || row.sender_role !== "admin") {
        console.error("ADMIN GEO CHAT MESSAGE CREATE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    return {
        success: true,
        message: {
            id: row.id,
            chat_id: row.chat_id,
            user_id: row.user_id,
            content: row.content,
            reply_to_id: row.reply_to_id,
            sender_role: "admin",
            created_at: row.created_at,
            updated_at: row.updated_at
        }
    }
}