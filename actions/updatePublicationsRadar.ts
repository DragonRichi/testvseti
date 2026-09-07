"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SortMode = "latest" | "popular" | "discussed"

type Props = {
    radarId: string
    name: string
    sortMode: string
    profileIds: string[]
}

type RpcStatus = "ok" | "unauthorized" | "invalid_name" | "name_too_long" | "invalid_sort" | "empty_sources" | "profile_not_found" | "radar_not_found" | "invalid_type"

type RpcRow = {
    status: RpcStatus
    radar_id: string | null
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

const allowedSortModes: SortMode[] = ["latest", "popular", "discussed"]
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getRpcError(status: RpcStatus) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "invalid_name") return "Введите название радара"
    if (status === "name_too_long") return "Название радара слишком длинное"
    if (status === "invalid_sort") return "Некорректная сортировка"
    if (status === "empty_sources") return "Выберите хотя бы один аккаунт"
    if (status === "profile_not_found") return "Один или несколько аккаунтов не найдены"
    if (status === "radar_not_found") return "Радар не найден"
    if (status === "invalid_type") return "Можно редактировать только радар публикаций"

    return "Не удалось обновить радар"
}

export async function updatePublicationsRadar({ radarId, name, sortMode, profileIds }: Props): Promise<Result> {
    const normalizedName = typeof name === "string" ? name.trim() : ""
    const normalizedProfileIds = Array.isArray(profileIds) ? [...new Set(profileIds.filter((profileId): profileId is string => typeof profileId === "string").map((profileId) => profileId.trim()).filter(Boolean))] : []

    if (typeof radarId !== "string" || !uuidPattern.test(radarId)) {
        return {
            success: false,
            error: "Радар не найден"
        }
    }

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

    if (typeof sortMode !== "string" || !allowedSortModes.includes(sortMode as SortMode)) {
        return {
            success: false,
            error: "Некорректная сортировка"
        }
    }

    if (normalizedProfileIds.length === 0) {
        return {
            success: false,
            error: "Выберите хотя бы один аккаунт"
        }
    }

    if (normalizedProfileIds.some((profileId) => !uuidPattern.test(profileId))) {
        return {
            success: false,
            error: "Некорректный аккаунт в списке"
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

    const { data, error } = await supabase.rpc("update_publications_radar", {
        p_radar_id: radarId,
        p_name: normalizedName,
        p_sort_mode: sortMode,
        p_profile_ids: normalizedProfileIds
    })

    if (error) {
        console.error("PUBLICATIONS RADAR UPDATE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось обновить радар"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось обновить радар"
        }
    }

    if (row.status !== "ok") {
        return {
            success: false,
            error: getRpcError(row.status)
        }
    }

    if (!row.radar_id) {
        console.error("PUBLICATIONS RADAR UPDATE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось обновить радар"
        }
    }

    revalidatePath("/feed")
    revalidatePath(`/radars/${row.radar_id}/edit`)

    return {
        success: true,
        error: null
    }
}