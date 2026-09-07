import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { GeoFeedItem } from "@/types/geoFeed"
import type { Post, Profile } from "@/types/social"

type Result = {
    items: GeoFeedItem[]
}

export async function getGeoFeedItems(posts: Post[], currentUserId: string): Promise<Result> {
    if (posts.length === 0) {
        return {
            items: []
        }
    }

    const supabase = await createClient()
    const postIds = posts.map((post) => post.id)
    const userIds = [...new Set(posts.map((post) => post.user_id))]

    const [{ data: profiles, error: profilesError }, { data: postLikes, error: postLikesError }] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds),
        supabase.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
    ])

    if (profilesError) {
        console.error("FEED PROFILES LOAD ERROR:", profilesError)
    }

    if (postLikesError) {
        console.error("FEED POST LIKES LOAD ERROR:", postLikesError)
    }

    const profilesById = new Map<string, Profile>()

    for (const profile of profiles ?? []) {
        profilesById.set(profile.id, profile)
    }

    const likedPostIds = new Set((postLikes ?? []).map((like) => like.post_id))
    const items: GeoFeedItem[] = []

    for (const post of posts) {
        const author = profilesById.get(post.user_id)

        if (!author) continue

        items.push({
            post,
            author,
            initialLiked: likedPostIds.has(post.id)
        })
    }

    return {
        items
    }
}