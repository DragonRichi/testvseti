"use server"

import { createClient } from "@/lib/supabase/server"

type Result =
    | {
        success: true
        messageId: string
    }
    | {
        success: false
        error: string
    }

export async function deleteGeoChatMessage(chatId: string, messageId: string): Promise<Result> {
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
        console.error("GEO CHAT DELETE ACCESS ERROR:", accessError)

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
        console.error("GEO CHAT DELETE FIND ERROR:", existingError)

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
            error: "Можно удалять только свои сообщения"
        }
    }

    const { error } = await supabase
        .from("geo_chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("chat_id", chatId)
        .eq("user_id", user.id)

    if (error) {
        console.error("GEO CHAT DELETE ERROR:", error)

        return {
            success: false,
            error: "Не удалось удалить сообщение"
        }
    }

    return {
        success: true,
        messageId
    }
}