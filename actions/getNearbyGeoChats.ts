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
    distance_m: number
    creator_username: string
    creator_display_name: string | null
    creator_avatar_url: string | null
    created_at: string
}

type AdminGeoChatRow = {
    id: string
    creator_id: string
    name: string
    description: string | null
    radius_m: number
    latitude: number
    longitude: number
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

function getDistanceMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
    const earthRadiusM = 6371000
    const toRadians = (value: number) => value * Math.PI / 180

    const latitudeDelta = toRadians(latitude2 - latitude1)
    const longitudeDelta = toRadians(longitude2 - longitude1)

    const a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) + Math.cos(toRadians(latitude1)) * Math.cos(toRadians(latitude2)) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadiusM * c
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

    const adminMode = await hasGeoChatAdminMode()

    if (adminMode) {
        const [{ data: chats, error: chatsError }, { data: currentLocation, error: locationError }] = await Promise.all([
            supabaseAdmin.from("geo_chats").select("id,creator_id,name,description,radius_m,latitude,longitude,created_at").order("created_at", { ascending: false }),
            supabaseAdmin.from("user_precise_locations").select("latitude,longitude").eq("user_id", user.id).maybeSingle()
        ])

        if (chatsError) {
            console.error("GET ALL GEO CHATS ERROR:", chatsError)

            return {
                success: false,
                error: "Не удалось загрузить все геочаты"
            }
        }

        if (locationError) {
            console.error("GET GEO CHAT ADMIN LOCATION ERROR:", locationError)
        }

        const rows = (chats ?? []) as AdminGeoChatRow[]
        const creatorIds = Array.from(new Set(rows.map((chat) => chat.creator_id)))

        const { data: profiles, error: profilesError } = creatorIds.length > 0
            ? await supabaseAdmin.from("profiles").select("id,username,display_name,avatar_url").in("id", creatorIds)
            : { data: [], error: null }

        if (profilesError) {
            console.error("GET GEO CHAT ADMIN PROFILES ERROR:", profilesError)

            return {
                success: false,
                error: "Не удалось загрузить авторов геочатов"
            }
        }

        const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

        const result: NearbyGeoChat[] = rows.map((chat) => {
            const creator = profilesById.get(chat.creator_id)

            const distanceM = currentLocation
                ? getDistanceMeters(currentLocation.latitude, currentLocation.longitude, chat.latitude, chat.longitude)
                : null

            return {
                id: chat.id,
                creatorId: chat.creator_id,
                name: chat.name,
                description: chat.description,
                radiusM: chat.radius_m,
                distanceM,
                creatorUsername: creator?.username ?? "unknown",
                creatorDisplayName: creator?.display_name ?? creator?.username ?? "Пользователь",
                creatorAvatarUrl: creator?.avatar_url ?? null,
                createdAt: chat.created_at
            }
        })

        result.sort((left, right) => {
            if (left.distanceM === null && right.distanceM === null) return 0
            if (left.distanceM === null) return 1
            if (right.distanceM === null) return -1
            return left.distanceM - right.distanceM
        })

        return {
            success: true,
            chats: result,
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

    const rows = (data ?? []) as NearbyGeoChatRow[]

    return {
        success: true,
        adminMode: false,
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