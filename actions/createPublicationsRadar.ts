"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SortMode = "latest" | "popular" | "discussed"

type Props = {
    name: string
    sortMode: string
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

type RpcStatus = "ok" | "unauthorized" | "invalid_name" | "name_too_long" | "invalid_sort" | "empty_sources" | "profile_not_found"

type RpcRow = {
    status: RpcStatus
    radar_id: string | null
    radar_user_id: string | null
    radar_type: string | null
    radar_name: string | null
    radar_sort_mode: string | null
    radar_created_at: string | null
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

const allowedSortModes: SortMode[] = ["latest", "popular", "discussed"]
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getRpcError(status: RpcStatus) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "invalid_name") return "Введите название радара"
    if (status === "name_too_long") return "Название радара слишком длинное"
    if (status === "invalid_sort") return "Некорректная сортировка"
    if (status === "empty_sources") return "Выберите хотя бы один аккаунт"
    if (status === "profile_not_found") return "Один или несколько аккаунтов не найдены"

    return "Не удалось создать радар"
}

export async function createPublicationsRadar({ name, sortMode, profileIds }: Props): Promise<CreatePublicationsRadarResult> {
    const normalizedName = typeof name === "string" ? name.trim() : ""
    const normalizedProfileIds = Array.isArray(profileIds) ? [...new Set(profileIds.filter((profileId): profileId is string => typeof profileId === "string").map((profileId) => profileId.trim()).filter(Boolean))] : []

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

    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                error: "Необходимо войти в аккаунт"
            }
        }

        const supabase = await createClient()

        const { data, error } = await supabase.rpc("create_publications_radar", {
            p_name: normalizedName,
            p_sort_mode: sortMode,
            p_profile_ids: normalizedProfileIds
        })

        if (error) {
            console.error("PUBLICATIONS RADAR CREATE RPC ERROR:", error)

            return {
                success: false,
                error: "Не удалось создать радар"
            }
        }

        const row = ((data ?? []) as RpcRow[])[0]

        if (!row) {
            return {
                success: false,
                error: "Не удалось создать радар"
            }
        }

        if (row.status !== "ok") {
            return {
                success: false,
                error: getRpcError(row.status)
            }
        }

        if (!row.radar_id || !row.radar_user_id || !row.radar_type || !row.radar_name) {
            console.error("PUBLICATIONS RADAR CREATE RPC INVALID RESPONSE:", row)

            return {
                success: false,
                error: "Не удалось создать радар"
            }
        }

        const radar: Radar = {
            id: row.radar_id,
            user_id: row.radar_user_id,
            type: row.radar_type,
            name: row.radar_name,
            sort_mode: row.radar_sort_mode,
            created_at: row.radar_created_at
        }

        revalidatePath("/feed")
        revalidatePath("/radars/new")

        return {
            success: true,
            error: null,
            radar
        }
    } catch (error) {
        console.error("PUBLICATIONS RADAR CREATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка создания радара"
        }
    }
}