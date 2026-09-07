"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type RpcStatus = "ok" | "unauthorized" | "outside" | "message_not_found" | "not_owner"

type RpcRow = {
    status: RpcStatus
    message_id: string | null
}

type Result =
    | {
        success: true
        messageId: string
    }
    | {
        success: false
        error: string
    }

function getRpcError(status: RpcStatus) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "outside") return "Вы находитесь вне зоны этого геочата"
    if (status === "message_not_found") return "Сообщение не найдено"
    if (status === "not_owner") return "Можно удалять только свои сообщения"

    return "Не удалось удалить сообщение"
}

export async function deleteGeoChatMessage(chatId: string, messageId: string): Promise<Result> {
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

        const result = await supabaseAdmin.rpc("delete_admin_geo_chat_message", {
            p_chat_id: chatId,
            p_message_id: messageId,
            p_user_id: user.id
        })

        data = result.data
        error = result.error
    } else {
        const result = await supabase.rpc("delete_geo_chat_message", {
            p_chat_id: chatId,
            p_message_id: messageId
        })

        data = result.data
        error = result.error
    }

    if (error) {
        console.error(adminMode ? "ADMIN GEO CHAT DELETE RPC ERROR:" : "GEO CHAT DELETE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось удалить сообщение"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось удалить сообщение"
        }
    }

    if (row.status !== "ok") {
        return {
            success: false,
            error: getRpcError(row.status)
        }
    }

    if (!row.message_id) {
        console.error("GEO CHAT DELETE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось удалить сообщение"
        }
    }

    return {
        success: true,
        messageId: row.message_id
    }
}