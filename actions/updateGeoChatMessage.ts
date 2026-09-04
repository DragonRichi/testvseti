"use server"

import { createClient } from "@/lib/supabase/server"

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
        console.error("GEO CHAT UPDATE ACCESS ERROR:", accessError)

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

    const { data: existingMessage, error: existingError } = await supabase
        .from("geo_chat_messages")
        .select("id,user_id")
        .eq("id", messageId)
        .eq("chat_id", chatId)
        .maybeSingle()

    if (existingError) {
        console.error("GEO CHAT UPDATE FIND ERROR:", existingError)

        return {
            success: false,
            error: "Не удалось найти сообщение"
        }
    }

    if (!existingMessage) {
        return {
            success: false,
            error: "Сообщение не найдено"
        }
    }

    if (existingMessage.user_id !== user.id) {
        return {
            success: false,
            error: "Можно изменять только свои сообщения"
        }
    }

    const updatedAt = new Date().toISOString()

    const { data, error } = await supabase
        .from("geo_chat_messages")
        .update({
            content: normalizedContent,
            updated_at: updatedAt
        })
        .eq("id", messageId)
        .eq("chat_id", chatId)
        .eq("user_id", user.id)
        .select("id,content,updated_at")
        .single()

    if (error || !data) {
        console.error("GEO CHAT UPDATE ERROR:", error)

        return {
            success: false,
            error: "Не удалось изменить сообщение"
        }
    }

    return {
        success: true,
        message: data
    }
}