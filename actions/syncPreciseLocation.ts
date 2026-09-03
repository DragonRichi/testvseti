"use server"

import { createClient } from "@/lib/supabase/server"

type Props = {
    latitude: number
    longitude: number
    accuracy: number | null
}

type Result =
    | {
        success: true
    }
    | {
        success: false
        error: string
    }

export async function syncPreciseLocation({ latitude, longitude, accuracy }: Props): Promise<Result> {
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

    const { error } = await supabase
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

    if (error) {
        console.error("PRECISE LOCATION SYNC ERROR:", error)

        return {
            success: false,
            error: "Не удалось обновить точное местоположение"
        }
    }

    return {
        success: true
    }
}