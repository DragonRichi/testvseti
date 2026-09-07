"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type AdminMessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    reply_to_id: string | null
    sender_role: "admin"
    created_at: string
    updated_at: string
}

type Result =
    | {
        success: true
        message: AdminMessageRow
    }
    | {
        success: false
        error: string
    }

export async function createAdminGeoChatMessage(chatId: string, content: string, replyToId: string | null = null): Promise<Result> {
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

    const { data: chat, error: chatError } = await supabaseAdmin.from("geo_chats").select("id").eq("id", chatId).maybeSingle()

    if (chatError || !chat) {
        console.error("ADMIN GEO CHAT LOAD ERROR:", chatError)

        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    if (replyToId) {
        const { data: replyMessage, error: replyError } = await supabaseAdmin.from("geo_chat_messages").select("id,chat_id").eq("id", replyToId).maybeSingle()

        if (replyError || !replyMessage || replyMessage.chat_id !== chatId) {
            console.error("ADMIN GEO CHAT REPLY LOAD ERROR:", replyError)

            return {
                success: false,
                error: "Сообщение для ответа не найдено"
            }
        }
    }

    const { data, error } = await supabaseAdmin
        .from("geo_chat_messages")
        .insert({
            chat_id: chatId,
            user_id: user.id,
            content: normalizedContent,
            reply_to_id: replyToId,
            sender_role: "admin"
        })
        .select("id,chat_id,user_id,content,reply_to_id,sender_role,created_at,updated_at")
        .single()

    if (error || !data) {
        console.error("ADMIN GEO CHAT MESSAGE CREATE ERROR:", error)

        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    return {
        success: true,
        message: data as AdminMessageRow
    }
}