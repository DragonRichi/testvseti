"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type RpcStatus = "ok" | "unauthorized" | "empty" | "too_long" | "outside" | "message_not_found" | "not_owner"

type RpcRow = {
    status: RpcStatus
    message_id: string | null
    message_content: string | null
    message_updated_at: string | null
}

type Result =
    | {
        success: true
        message: {
            id: string
            content: string
            updated_at: string
        }
    }
    | {
        success: false
        error: string
    }

function getRpcError(status: RpcStatus) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "empty") return "Введите сообщение"
    if (status === "too_long") return "Сообщение не должно превышать 4000 символов"
    if (status === "outside") return "Вы находитесь вне зоны этого геочата"
    if (status === "message_not_found") return "Сообщение не найдено"
    if (status === "not_owner") return "Можно изменять только свои сообщения"

    return "Не удалось изменить сообщение"
}

export async function updateGeoChatMessage(chatId: string, messageId: string, content: string): Promise<Result> {
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
    const adminMode = await hasGeoChatAdminMode()

    let data: unknown = null
    let error: unknown = null

    if (adminMode) {
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

        const result = await supabaseAdmin.rpc("update_admin_geo_chat_message", {
            p_chat_id: chatId,
            p_message_id: messageId,
            p_user_id: user.id,
            p_content: normalizedContent
        })

        data = result.data
        error = result.error
    } else {
        const result = await supabase.rpc("update_geo_chat_message", {
            p_chat_id: chatId,
            p_message_id: messageId,
            p_content: normalizedContent
        })

        data = result.data
        error = result.error
    }

    if (error) {
        console.error(adminMode ? "ADMIN GEO CHAT UPDATE RPC ERROR:" : "GEO CHAT UPDATE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось изменить сообщение"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось изменить сообщение"
        }
    }

    if (row.status !== "ok") {
        return {
            success: false,
            error: getRpcError(row.status)
        }
    }

    if (!row.message_id || row.message_content === null || !row.message_updated_at) {
        console.error("GEO CHAT UPDATE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось изменить сообщение"
        }
    }

    return {
        success: true,
        message: {
            id: row.message_id,
            content: row.message_content,
            updated_at: row.message_updated_at
        }
    }
}