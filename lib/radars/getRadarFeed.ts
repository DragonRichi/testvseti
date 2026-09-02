import "server-only"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/types/social"

type Radar = {
    id: string
    user_id: string
    type: string
    name: string
    sort_mode: string | null
}

type Result =
    | {
        success: true
        radar: Radar
        posts: Post[]
    }
    | {
        success: false
        error: string
    }

export async function getRadarFeed(radarId: string): Promise<Result> {
    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const supabase = await createClient()

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

    if (radar.type !== "publications") {
        return {
            success: false,
            error: "Этот радар не является радаром публикаций"
        }
    }

    const { data: sources, error: sourcesError } = await supabase.from("radar_sources").select("source_id").eq("radar_id", radar.id).eq("source_type", "user")

    if (sourcesError) {
        console.error("RADAR SOURCES LOAD ERROR:", sourcesError)

        return {
            success: false,
            error: "Не удалось загрузить источники радара"
        }
    }

    const profileIds = [...new Set((sources ?? []).map((source) => source.source_id))]

    if (profileIds.length === 0) {
        return {
            success: true,
            radar,
            posts: []
        }
    }

    let query = supabase.from("posts").select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code").in("user_id", profileIds).eq("visibility", "all")

    if (radar.sort_mode === "popular") {
        query = query.order("like_count", { ascending: false }).order("created_at", { ascending: false })
    } else if (radar.sort_mode === "discussed") {
        query = query.order("comment_count", { ascending: false }).order("created_at", { ascending: false })
    } else {
        query = query.order("created_at", { ascending: false })
    }

    const { data: posts, error: postsError } = await query.limit(20)

    if (postsError) {
        console.error("RADAR POSTS LOAD ERROR:", postsError)

        return {
            success: false,
            error: "Не удалось загрузить публикации радара"
        }
    }

    return {
        success: true,
        radar,
        posts: posts ?? []
    }
}