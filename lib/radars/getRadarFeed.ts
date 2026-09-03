import "server-only"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import type { Radar, RadarFeedCursor } from "@/types/radar"
import type { Post } from "@/types/social"

type Options = {
    limit?: number
    cursor?: RadarFeedCursor | null
}

type Result =
    | {
        success: true
        radar: Radar
        posts: Post[]
        nextCursor: RadarFeedCursor | null
    }
    | {
        success: false
        error: string
    }

const DEFAULT_LIMIT = 20

function createNextCursor(radar: Radar, post: Post): RadarFeedCursor {
    let score: number | null = null

    if (radar.sort_mode === "popular") {
        score = post.like_count ?? 0
    }

    if (radar.sort_mode === "discussed") {
        score = post.comment_count ?? 0
    }

    return {
        id: post.id,
        createdAt: post.created_at,
        score
    }
}

export async function getRadarFeed(radarId: string, options: Options = {}): Promise<Result> {
    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const supabase = await createClient()
    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 20)
    const cursor = options.cursor ?? null

    const { data: radar, error: radarError } = await supabase.from("radars").select("id,user_id,type,name,sort_mode").eq("id", radarId).eq("user_id", user.id).maybeSingle()

    if (radarError) {
        console.error("RADAR LOAD ERROR:", radarError)

        return {
            success: false,
            error: "Не удалось загрузить радар"
        }
    }

    if (!radar) {
        return {
            success: false,
            error: "Радар не найден"
        }
    }

    const typedRadar = radar as Radar

    if (typedRadar.type === "tracking") {
        const { data: posts, error: postsError } = await supabase.rpc("get_tracking_radar_posts", {
            p_radar_id: typedRadar.id,
            p_limit: limit + 1,
            p_cursor_score: cursor?.score ?? null,
            p_cursor_created_at: cursor?.createdAt ?? null,
            p_cursor_id: cursor?.id ?? null
        })

        if (postsError) {
            console.error("TRACKING RADAR POSTS LOAD ERROR:", postsError)

            return {
                success: false,
                error: "Не удалось загрузить публикации радара"
            }
        }

        const loadedPosts = (posts ?? []) as Post[]
        const hasMore = loadedPosts.length > limit
        const visiblePosts = loadedPosts.slice(0, limit)
        const lastPost = visiblePosts.at(-1)

        return {
            success: true,
            radar: typedRadar,
            posts: visiblePosts,
            nextCursor: hasMore && lastPost ? createNextCursor(typedRadar, lastPost) : null
        }
    }

    const { data: posts, error: postsError } = await supabase.rpc("get_publications_radar_posts", {
        p_radar_id: typedRadar.id,
        p_limit: limit + 1,
        p_cursor_score: cursor?.score ?? null,
        p_cursor_created_at: cursor?.createdAt ?? null,
        p_cursor_id: cursor?.id ?? null
    })

    if (postsError) {
        console.error("PUBLICATIONS RADAR POSTS LOAD ERROR:", postsError)

        return {
            success: false,
            error: "Не удалось загрузить публикации радара"
        }
    }

    const loadedPosts = (posts ?? []) as Post[]
    const hasMore = loadedPosts.length > limit
    const visiblePosts = loadedPosts.slice(0, limit)
    const lastPost = visiblePosts.at(-1)

    return {
        success: true,
        radar: typedRadar,
        posts: visiblePosts,
        nextCursor: hasMore && lastPost ? createNextCursor(typedRadar, lastPost) : null
    }
}