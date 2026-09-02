"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SortMode = "nearest" | "latest" | "popular" | "discussed"
type RadiusM = 3000 | 6000 | 9000 | 12000

type Props = {
    radarId: string
    name: string
    sortMode: SortMode
    latitude: number
    longitude: number
    radiusM: RadiusM
}

type Result =
    | {
        success: true
        error: null
    }
    | {
        success: false
        error: string
    }

const allowedRadii: RadiusM[] = [3000, 6000, 9000, 12000]
const allowedSortModes: SortMode[] = ["nearest", "latest", "popular", "discussed"]

export async function updateTrackingRadar({ radarId, name, sortMode, latitude, longitude, radiusM }: Props): Promise<Result> {
    const normalizedName = name.trim()

    if (!normalizedName) {
        return {
            success: false,
            error: "Введите название радара"
        }
    }

    if (normalizedName.length > 100) {
        return {
            success: false,
            error: "Название радара слишком длинное"
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

    if (!allowedRadii.includes(radiusM)) {
        return {
            success: false,
            error: "Некорректный радиус"
        }
    }

    if (!allowedSortModes.includes(sortMode)) {
        return {
            success: false,
            error: "Некорректная сортировка"
        }
    }

    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const supabase = await createClient()

    const { data: radar, error: radarError } = await supabase.from("radars").select("id,user_id,type").eq("id", radarId).eq("user_id", user.id).maybeSingle()

    if (radarError) {
        console.error("TRACKING RADAR EDIT LOAD ERROR:", radarError)

        return {
            success: false,
            error: "Не удалось загрузить радар"
        }
    }

    if (!radar) {
        return {
            success: false,
            error: "Радар не найден"
        }
    }

    if (radar.type !== "tracking") {
        return {
            success: false,
            error: "Это не радар слежения"
        }
    }

    const location = `POINT(${longitude} ${latitude})`

    const { error: updateError } = await supabase.from("radars").update({
        name: normalizedName,
        sort_mode: sortMode,
        location,
        radius_m: radiusM
    }).eq("id", radar.id).eq("user_id", user.id)

    if (updateError) {
        console.error("TRACKING RADAR UPDATE ERROR:", updateError)

        return {
            success: false,
            error: "Не удалось обновить радар"
        }
    }

    revalidatePath("/feed")
    revalidatePath(`/radars/${radar.id}/edit/tracking`)

    return {
        success: true,
        error: null
    }
}