"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { loadGeoChatMessages } from "@/lib/geochats/loadGeoChatMessages"
import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessage } from "@/types/geoChat"

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

    const adminMode = await hasGeoChatAdminMode()

    if (!adminMode) {
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
    }

    try {
        const messages = await loadGeoChatMessages(supabase, chatId, adminMode)

        return {
            success: true,
            messages
        }
    } catch (error) {
        console.error("GEO CHAT MESSAGES REFRESH ERROR:", error)

        return {
            success: false,
            error: "Не удалось обновить сообщения"
        }
    }
}