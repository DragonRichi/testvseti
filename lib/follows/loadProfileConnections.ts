import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"

export const PROFILE_CONNECTIONS_PAGE_SIZE = 20

type Props = {
    supabase: SupabaseClient
    viewerId: string
    profileId: string
    type: ProfileConnectionType
    offset?: number
    limit?: number
}

type ConnectionRow = {
    follower_id: string
    following_id: string
    created_at: string
}

type Result = {
    items: ProfileConnectionItem[]
    hasMore: boolean
    nextOffset: number
}

export async function loadProfileConnections({ supabase, viewerId, profileId, type, offset = 0, limit = PROFILE_CONNECTIONS_PAGE_SIZE }: Props): Promise<Result> {
    const safeOffset = Math.max(0, Math.floor(offset))
    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50))

    let query = supabase.from("follows").select("follower_id,following_id,created_at").order("created_at", { ascending: false })

    if (type === "followers") {
        query = query.eq("following_id", profileId).order("follower_id", { ascending: false })
    } else {
        query = query.eq("follower_id", profileId).order("following_id", { ascending: false })
    }

    const { data: connectionData, error: connectionsError } = await query.range(safeOffset, safeOffset + safeLimit)

    if (connectionsError) {
        console.error("PROFILE CONNECTIONS LOAD ERROR:", connectionsError)
        throw new Error("Не удалось загрузить список")
    }

    const connectionRows = (connectionData ?? []) as ConnectionRow[]
    const hasMore = connectionRows.length > safeLimit
    const pageRows = connectionRows.slice(0, safeLimit)
    const nextOffset = safeOffset + pageRows.length
    const profileIds = pageRows.map((connection) => type === "followers" ? connection.follower_id : connection.following_id)

    if (profileIds.length === 0) {
        return {
            items: [],
            hasMore: false,
            nextOffset
        }
    }

    const skipFollowStateQuery = type === "following" && viewerId === profileId

    const [{ data: profiles, error: profilesError }, myFollowsResult] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", profileIds),
        skipFollowStateQuery
            ? Promise.resolve({
                data: profileIds.map((followingId) => ({
                    following_id: followingId
                })),
                error: null
            })
            : supabase.from("follows").select("following_id").eq("follower_id", viewerId).in("following_id", profileIds)
    ])

    if (profilesError) {
        console.error("PROFILE CONNECTION PROFILES LOAD ERROR:", profilesError)
        throw new Error("Не удалось загрузить пользователей")
    }

    if (myFollowsResult.error) {
        console.error("PROFILE CONNECTION FOLLOW STATE LOAD ERROR:", myFollowsResult.error)
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const myFollowingIds = new Set((myFollowsResult.data ?? []).map((follow) => follow.following_id))
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
            isCurrentUser: profile.id === viewerId
        })
    }

    return {
        items,
        hasMore,
        nextOffset
    }
}