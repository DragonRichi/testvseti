"use server"

import { createClient } from "@/lib/supabase/server"

type Result =
    | {
        success: true
        message: {
            id: string
            chat_id: string
            user_id: string
            content: string
            created_at: string
            updated_at: string
        }
    }
    | {
        success: false
        error: string
    }

export async function createGeoChatMessage(chatId: string, content: string): Promise<Result> {
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

    const { data, error } = await supabase
        .from("geo_chat_messages")
        .insert({
            chat_id: chatId,
            user_id: user.id,
            content: normalizedContent
        })
        .select("id,chat_id,user_id,content,created_at,updated_at")
        .single()

    if (error || !data) {
        console.error("GEO CHAT MESSAGE CREATE ERROR:", error)

        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    return {
        success: true,
        message: data
    }
}