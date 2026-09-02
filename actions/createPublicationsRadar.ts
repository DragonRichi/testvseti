"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SortMode = "latest" | "popular" | "discussed" | "nearest"

type Props = {
    name: string
    sortMode: SortMode
    profileIds: string[]
}

type Radar = {
    id: string
    user_id: string
    type: string
    name: string
    sort_mode: string | null
    created_at: string | null
}

type CreatePublicationsRadarResult =
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

export async function createPublicationsRadar({ name, sortMode, profileIds }: Props): Promise<CreatePublicationsRadarResult> {
    const normalizedName = name.trim()
    const normalizedProfileIds = [...new Set(profileIds.filter(Boolean))]

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

    if (normalizedProfileIds.length === 0) {
        return {
            success: false,
            error: "Выберите хотя бы один аккаунт"
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

        const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id").in("id", normalizedProfileIds)

        if (profilesError) {
            console.error("RADAR PROFILES LOAD ERROR:", profilesError)

            return {
                success: false,
                error: "Не удалось проверить выбранные аккаунты"
            }
        }

        if ((profiles ?? []).length !== normalizedProfileIds.length) {
            return {
                success: false,
                error: "Один или несколько аккаунтов не найдены"
            }
        }

        const { data: radar, error: radarError } = await supabase.from("radars").insert({
            user_id: user.id,
            type: "publications",
            name: normalizedName,
            sort_mode: sortMode,
            location: null,
            radius_m: null
        }).select("id,user_id,type,name,sort_mode,created_at").single()

        if (radarError || !radar) {
            console.error("RADAR CREATE ERROR:", radarError)

            return {
                success: false,
                error: "Не удалось создать радар"
            }
        }

        const sources = normalizedProfileIds.map((profileId) => ({
            radar_id: radar.id,
            source_type: "user",
            source_id: profileId
        }))

        const { error: sourcesError } = await supabase.from("radar_sources").insert(sources)

        if (sourcesError) {
            console.error("RADAR SOURCES CREATE ERROR:", sourcesError)

            await supabase.from("radars").delete().eq("id", radar.id).eq("user_id", user.id)

            return {
                success: false,
                error: "Не удалось добавить аккаунты в радар"
            }
        }

        revalidatePath("/feed")

        return {
            success: true,
            error: null,
            radar
        }
    } catch (error) {
        console.error("RADAR CREATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка создания радара"
        }
    }
}