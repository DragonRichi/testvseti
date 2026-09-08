import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { RadarFeedItem } from "@/types/radar"
import type { Post, Profile } from "@/types/social"

type Result =
    | { success: true; items: RadarFeedItem[] }
    | { success: false; error: string }

export async function getRadarFeedItems(posts: Post[], currentUserId: string): Promise<Result> {
    if (posts.length === 0) return { success: true, items: [] }

    const supabase = await createClient()
    const postIds = posts.map((post) => post.id)
    const authorIds = [...new Set(posts.map((post) => post.user_id))]

    const [profilesResult, postLikesResult] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", authorIds),
        supabase.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
    ])

    if (profilesResult.error) {
        console.error("RADAR PROFILES LOAD ERROR:", profilesResult.error)
        return { success: false, error: "Не удалось загрузить авторов публикаций" }
    }

    if (postLikesResult.error) {
        console.error("RADAR POST LIKES LOAD ERROR:", postLikesResult.error)
    }

    const profilesById = new Map<string, Profile>()

    for (const profile of profilesResult.data ?? []) {
        profilesById.set(profile.id, profile)
    }

    const likedPostIds = new Set((postLikesResult.data ?? []).map((like) => like.post_id))
    const items: RadarFeedItem[] = []

    for (const post of posts) {
        const author = profilesById.get(post.user_id)
        if (!author) continue

        items.push({
            post,
            author,
            initialLiked: likedPostIds.has(post.id)
        })
    }

    return { success: true, items }
}
