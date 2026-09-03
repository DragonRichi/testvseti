"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
        chatId: string
    }
    | {
        success: false
        error: string
    }

const allowedRadii = new Set([3000, 6000, 9000, 12000])

export async function createGeoChat(name: string, description: string, latitude: number, longitude: number, radiusM: number): Promise<Result> {
    const normalizedName = name.trim()
    const normalizedDescription = description.trim()

    if (normalizedName.length < 1 || normalizedName.length > 80) {
        return {
            success: false,
            error: "Название должно содержать от 1 до 80 символов"
        }
    }

    if (normalizedDescription.length > 500) {
        return {
            success: false,
            error: "Описание не может быть длиннее 500 символов"
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

    if (!allowedRadii.has(radiusM)) {
        return {
            success: false,
            error: "Некорректный радиус"
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

    const { data, error } = await supabase
        .from("geo_chats")
        .insert({
            creator_id: user.id,
            name: normalizedName,
            description: normalizedDescription || null,
            location: `POINT(${longitude} ${latitude})`,
            radius_m: radiusM
        })
        .select("id")
        .single()

    if (error || !data) {
        console.error("CREATE GEO CHAT ERROR:", error)

        return {
            success: false,
            error: "Не удалось создать геочат"
        }
    }

    revalidatePath("/geochats")

    return {
        success: true,
        chatId: data.id
    }
}