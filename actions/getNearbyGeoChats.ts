"use server"

import { createClient } from "@/lib/supabase/server"
import type { NearbyGeoChat } from "@/types/geoChat"

type NearbyGeoChatRow = {
    id: string
    creator_id: string
    name: string
    description: string | null
    radius_m: number
    distance_m: number
    creator_username: string
    creator_display_name: string | null
    creator_avatar_url: string | null
    created_at: string
}

type Result =
    | {
        success: true
        chats: NearbyGeoChat[]
    }
    | {
        success: false
        error: string
    }

export async function getNearbyGeoChats(): Promise<Result> {
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

    const { data, error } = await supabase.rpc("get_nearby_geo_chats")

    if (error) {
        console.error("GET NEARBY GEO CHATS ERROR:", error)

        return {
            success: false,
            error: "Не удалось загрузить геочаты рядом"
        }
    }

    const rows = (data ?? []) as NearbyGeoChatRow[]

    return {
        success: true,
        chats: rows.map((row) => ({
            id: row.id,
            creatorId: row.creator_id,
            name: row.name,
            description: row.description,
            radiusM: row.radius_m,
            distanceM: row.distance_m,
            creatorUsername: row.creator_username,
            creatorDisplayName: row.creator_display_name ?? row.creator_username,
            creatorAvatarUrl: row.creator_avatar_url,
            createdAt: row.created_at
        }))
    }
}