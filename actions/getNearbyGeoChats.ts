"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { NearbyGeoChat } from "@/types/geoChat"

type NearbyGeoChatRow = {
    id: string
    creator_id: string
    name: string
    description: string | null
    radius_m: number
    distance_m: number | null
    creator_username: string
    creator_display_name: string | null
    creator_avatar_url: string | null
    created_at: string
}

type Result =
    | {
        success: true
        chats: NearbyGeoChat[]
        adminMode: boolean
    }
    | {
        success: false
        error: string
    }

function mapGeoChatRows(rows: NearbyGeoChatRow[]): NearbyGeoChat[] {
    return rows.map((row) => ({
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

export async function getNearbyGeoChats(): Promise<Result> {
    const supabase = await createClient()

    const [
        {
            data: { user },
            error: userError
        },
        adminMode
    ] = await Promise.all([
        supabase.auth.getUser(),
        hasGeoChatAdminMode()
    ])

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    if (adminMode) {
        const { data, error } = await supabaseAdmin.rpc("get_all_geo_chats_admin", {
            p_user_id: user.id
        })

        if (error) {
            console.error("GET ALL GEO CHATS ERROR:", error)

            return {
                success: false,
                error: "Не удалось загрузить все геочаты"
            }
        }

        return {
            success: true,
            chats: mapGeoChatRows((data ?? []) as NearbyGeoChatRow[]),
            adminMode: true
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

    return {
        success: true,
        chats: mapGeoChatRows((data ?? []) as NearbyGeoChatRow[]),
        adminMode: false
    }
}