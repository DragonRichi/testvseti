"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SortMode = "latest" | "popular" | "discussed" | "nearest"

type Props = {
    name: string
    sortMode: SortMode
    latitude: number
    longitude: number
    radiusM: 3000 | 6000 | 9000 | 12000
}

type Radar = {
    id: string
    user_id: string
    type: string
    name: string
    sort_mode: string | null
    radius_m: number | null
    radar_lat: number | null
    radar_lon: number | null
}

type Result =
    | {
        success: true
        error: null
        radar: Radar
    }
    | {
        success: false
        error: string
        radar?: never
    }

const allowedRadii = [3000, 6000, 9000, 12000]

export async function createTrackingRadar({ name, sortMode, latitude, longitude, radiusM }: Props): Promise<Result> {
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

    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                error: "Необходимо войти в аккаунт"
            }
        }

        const supabase = await createClient()

        const location = `POINT(${longitude} ${latitude})`

        const { data: radar, error } = await supabase.from("radars").insert({
            user_id: user.id,
            type: "tracking",
            name: normalizedName,
            sort_mode: sortMode,
            location,
            radius_m: radiusM
        }).select("id,user_id,type,name,sort_mode,radius_m,radar_lat,radar_lon").single()

        if (error || !radar) {
            console.error("TRACKING RADAR CREATE ERROR:", error)

            return {
                success: false,
                error: "Не удалось создать радар"
            }
        }

        revalidatePath("/feed")
        revalidatePath("/radars/new")

        return {
            success: true,
            error: null,
            radar
        }
    } catch (error) {
        console.error("TRACKING RADAR CREATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка создания радара"
        }
    }
}