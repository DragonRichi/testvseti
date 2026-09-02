"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SortMode = "latest" | "popular" | "discussed"

type Props = {
    radarId: string
    name: string
    sortMode: SortMode
    profileIds: string[]
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

export async function updatePublicationsRadar({ radarId, name, sortMode, profileIds }: Props): Promise<Result> {
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

    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const supabase = await createClient()

    const { data: radar, error: radarError } = await supabase.from("radars").select("id,type,user_id").eq("id", radarId).eq("user_id", user.id).maybeSingle()

    if (radarError) {
        console.error("RADAR EDIT LOAD ERROR:", radarError)

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

    if (radar.type !== "publications") {
        return {
            success: false,
            error: "Можно редактировать только радар публикаций"
        }
    }

    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id").in("id", normalizedProfileIds)

    if (profilesError) {
        console.error("RADAR EDIT PROFILES ERROR:", profilesError)

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

    const { error: updateError } = await supabase.from("radars").update({
        name: normalizedName,
        sort_mode: sortMode
    }).eq("id", radar.id).eq("user_id", user.id)

    if (updateError) {
        console.error("RADAR UPDATE ERROR:", updateError)

        return {
            success: false,
            error: "Не удалось обновить радар"
        }
    }

    const { error: deleteSourcesError } = await supabase.from("radar_sources").delete().eq("radar_id", radar.id).eq("source_type", "user")

    if (deleteSourcesError) {
        console.error("RADAR SOURCES DELETE ERROR:", deleteSourcesError)

        return {
            success: false,
            error: "Не удалось обновить аккаунты радара"
        }
    }

    const sources = normalizedProfileIds.map((profileId) => ({
        radar_id: radar.id,
        source_type: "user",
        source_id: profileId
    }))

    const { error: sourcesError } = await supabase.from("radar_sources").insert(sources)

    if (sourcesError) {
        console.error("RADAR SOURCES UPDATE ERROR:", sourcesError)

        return {
            success: false,
            error: "Не удалось сохранить аккаунты радара"
        }
    }

    revalidatePath("/feed")
    revalidatePath(`/radars/${radar.id}/edit`)

    return {
        success: true,
        error: null
    }
}