"use server"

import { loadProfileConnections } from "@/lib/follows/loadProfileConnections"
import { createClient } from "@/lib/supabase/server"
import type { ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"

type Result =
    | {
        success: true
        items: ProfileConnectionItem[]
        hasMore: boolean
        nextOffset: number
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getProfileConnections(profileId: string, type: ProfileConnectionType, offset = 0): Promise<Result> {
    if (typeof profileId !== "string" || !uuidPattern.test(profileId)) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    if (type !== "followers" && type !== "following") {
        return {
            success: false,
            error: "Некорректный тип списка"
        }
    }

    if (!Number.isInteger(offset) || offset < 0) {
        return {
            success: false,
            error: "Некорректная страница"
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

    try {
        const page = await loadProfileConnections({
            supabase,
            viewerId: user.id,
            profileId,
            type,
            offset
        })

        return {
            success: true,
            items: page.items,
            hasMore: page.hasMore,
            nextOffset: page.nextOffset
        }
    } catch (error) {
        console.error("PROFILE CONNECTIONS ACTION ERROR:", error)

        return {
            success: false,
            error: error instanceof Error ? error.message : "Не удалось загрузить список"
        }
    }
}