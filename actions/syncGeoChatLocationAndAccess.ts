"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

type Props = {
    chatId: string
    latitude: number
    longitude: number
    accuracy: number | null
}

type Result =
    | {
        success: true
        canAccess: boolean
    }
    | {
        success: false
        error: string
    }

export async function syncGeoChatLocationAndAccess({ chatId, latitude, longitude, accuracy }: Props): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return {
            success: false,
            error: "Некорректная широта"
        }
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return {
            success: false,
            error: "Некорректная долгота"
        }
    }

    if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) {
        return {
            success: false,
            error: "Некорректная точность геолокации"
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

    const { error: locationError } = await supabaseAdmin
        .from("user_precise_locations")
        .upsert(
            {
                user_id: user.id,
                location: `POINT(${longitude} ${latitude})`,
                accuracy_m: accuracy,
                source: "browser",
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "user_id"
            }
        )

    if (locationError) {
        console.error("GEO CHAT PRECISE LOCATION SYNC ERROR:", locationError)

        return {
            success: false,
            error: "Не удалось обновить точное местоположение"
        }
    }

    const { data: canAccess, error: accessError } = await supabase.rpc("can_access_geo_chat", {
        p_chat_id: chatId
    })

    if (accessError) {
        console.error("GEO CHAT ACCESS CHECK ERROR:", accessError)

        return {
            success: false,
            error: "Не удалось проверить доступ к геочату"
        }
    }

    return {
        success: true,
        canAccess: Boolean(canAccess)
    }
}