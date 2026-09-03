"use server"

import { createClient } from "@/lib/supabase/server"
import type { ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"


type Result =
    | {
        success: true
        items: ProfileConnectionItem[]
    }
    | {
        success: false
        error: string
    }

export async function getProfileConnections(profileId: string, type: ProfileConnectionType): Promise<Result> {
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

    let query = supabase.from("follows").select("follower_id,following_id,created_at").order("created_at", { ascending: false }).limit(100)

    if (type === "followers") {
        query = query.eq("following_id", profileId)
    } else {
        query = query.eq("follower_id", profileId)
    }

    const { data: connections, error: connectionsError } = await query

    if (connectionsError) {
        console.error("PROFILE CONNECTIONS LOAD ERROR:", connectionsError)

        return {
            success: false,
            error: "Не удалось загрузить список"
        }
    }

    const profileIds = (connections ?? []).map((connection) => type === "followers" ? connection.follower_id : connection.following_id)

    if (profileIds.length === 0) {
        return {
            success: true,
            items: []
        }
    }

    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", profileIds)

    if (profilesError) {
        console.error("PROFILE CONNECTION PROFILES LOAD ERROR:", profilesError)

        return {
            success: false,
            error: "Не удалось загрузить пользователей"
        }
    }

    const { data: myFollows, error: myFollowsError } = await supabase.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", profileIds)

    if (myFollowsError) {
        console.error("PROFILE CONNECTION FOLLOW STATE LOAD ERROR:", myFollowsError)
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const myFollowingIds = new Set((myFollows ?? []).map((follow) => follow.following_id))

    const items: ProfileConnectionItem[] = []

    for (const profileId of profileIds) {
        const profile = profilesById.get(profileId)

        if (!profile) continue

        items.push({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name ?? profile.username,
            avatarUrl: profile.avatar_url,
            isFollowing: myFollowingIds.has(profile.id),
            isCurrentUser: profile.id === user.id
        })
    }

    return {
        success: true,
        items
    }
}