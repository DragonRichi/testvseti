import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProfileConnectionCursor, ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"

export const PROFILE_CONNECTIONS_PAGE_SIZE = 20

type Props = {
    supabase: SupabaseClient
    viewerId: string
    profileId: string
    type: ProfileConnectionType
    cursor?: ProfileConnectionCursor | null
    limit?: number
}

type ConnectionRow = {
    follower_id: string
    following_id: string
    created_at: string
}

type Result = {
    items: ProfileConnectionItem[]
    nextCursor: ProfileConnectionCursor | null
}

export async function loadProfileConnections({ supabase, viewerId, profileId, type, cursor = null, limit = PROFILE_CONNECTIONS_PAGE_SIZE }: Props): Promise<Result> {
    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50))
    const peerColumn = type === "followers" ? "follower_id" : "following_id"

    let query = supabase
        .from("follows")
        .select("follower_id,following_id,created_at")
        .order("created_at", { ascending: false })
        .order(peerColumn, { ascending: false })
        .limit(safeLimit + 1)

    query = type === "followers" ? query.eq("following_id", profileId) : query.eq("follower_id", profileId)

    if (cursor) {
        query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},${peerColumn}.lt.${cursor.id})`)
    }

    const { data: connectionData, error: connectionsError } = await query

    if (connectionsError) {
        console.error("PROFILE CONNECTIONS LOAD ERROR:", connectionsError)
        throw new Error("Не удалось загрузить список")
    }

    const loadedRows = (connectionData ?? []) as ConnectionRow[]
    const hasMore = loadedRows.length > safeLimit
    const pageRows = loadedRows.slice(0, safeLimit)
    const profileIds = pageRows.map((connection) => type === "followers" ? connection.follower_id : connection.following_id)
    const lastRow = pageRows.at(-1)

    const nextCursor: ProfileConnectionCursor | null = hasMore && lastRow
        ? { createdAt: lastRow.created_at, id: type === "followers" ? lastRow.follower_id : lastRow.following_id }
        : null

    if (profileIds.length === 0) return { items: [], nextCursor: null }

    const skipFollowStateQuery = type === "following" && viewerId === profileId
    const [profilesResult, myFollowsResult] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", profileIds),
        skipFollowStateQuery
            ? Promise.resolve({ data: profileIds.map((followingId) => ({ following_id: followingId })), error: null })
            : supabase.from("follows").select("following_id").eq("follower_id", viewerId).in("following_id", profileIds)
    ])

    if (profilesResult.error) {
        console.error("PROFILE CONNECTION PROFILES LOAD ERROR:", profilesResult.error)
        throw new Error("Не удалось загрузить пользователей")
    }

    if (myFollowsResult.error) {
        console.error("PROFILE CONNECTION FOLLOW STATE LOAD ERROR:", myFollowsResult.error)
    }

    const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))
    const myFollowingIds = new Set((myFollowsResult.data ?? []).map((follow) => follow.following_id))
    const items: ProfileConnectionItem[] = []

    for (const targetProfileId of profileIds) {
        const profile = profilesById.get(targetProfileId)
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

    return { items, nextCursor }
}
