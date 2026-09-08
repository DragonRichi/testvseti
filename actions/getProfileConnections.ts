"use server"

import { loadProfileConnections } from "@/lib/follows/loadProfileConnections"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type { ProfileConnectionCursor, ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"

type Result =
    | { success: true; items: ProfileConnectionItem[]; nextCursor: ProfileConnectionCursor | null }
    | { success: false; error: string }

function isValidCursor(cursor: ProfileConnectionCursor | null) {
    if (cursor === null) return true
    return isUuid(cursor.id) && typeof cursor.createdAt === "string" && !Number.isNaN(Date.parse(cursor.createdAt))
}

export async function getProfileConnections(profileId: string, type: ProfileConnectionType, cursor: ProfileConnectionCursor | null = null): Promise<Result> {
    if (!isUuid(profileId)) return { success: false, error: "Профиль не найден" }
    if (type !== "followers" && type !== "following") return { success: false, error: "Некорректный тип списка" }
    if (!isValidCursor(cursor)) return { success: false, error: "Некорректный курсор списка" }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) return { success: false, error: "Необходимо войти в аккаунт" }

    try {
        const page = await loadProfileConnections({ supabase, viewerId: user.id, profileId, type, cursor })
        return { success: true, items: page.items, nextCursor: page.nextCursor }
    } catch (error) {
        console.error("PROFILE CONNECTIONS ACTION ERROR:", error)
        return { success: false, error: error instanceof Error ? error.message : "Не удалось загрузить список" }
    }
}
