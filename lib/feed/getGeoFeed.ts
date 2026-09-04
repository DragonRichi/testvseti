import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { GeoFeedCursor } from "@/types/geoFeed"
import type { Post } from "@/types/social"

type Props = {
    cursor?: GeoFeedCursor | null
}

type Result =
    | {
        success: true
        posts: Post[]
        nextCursor: GeoFeedCursor | null
    }
    | {
        success: false
        error: string
    }

type GeoLevel = 1 | 2 | 3 | 4 | 5

type CandidateRow = {
    geo_level: number
    post_data: Post
}

const PAGE_SIZE = 20

const LEVELS = [
    {
        level: 1 as const,
        key: "city" as const,
        quota: 3
    },
    {
        level: 2 as const,
        key: "region" as const,
        quota: 4
    },
    {
        level: 3 as const,
        key: "country" as const,
        quota: 6
    },
    {
        level: 4 as const,
        key: "priority" as const,
        quota: 4
    },
    {
        level: 5 as const,
        key: "world" as const,
        quota: 3
    }
]

function comparePosts(a: Post, b: Post) {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : Number.NEGATIVE_INFINITY
    const bTime = b.created_at ? new Date(b.created_at).getTime() : Number.NEGATIVE_INFINITY

    if (aTime !== bTime) {
        return bTime - aTime
    }

    if (a.id === b.id) return 0

    return a.id < b.id ? 1 : -1
}

export async function getGeoFeed({ cursor = null }: Props = {}): Promise<Result> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_geo_feed_page", {
        p_per_level: 21,

        p_city_cursor_created_at: cursor?.city?.createdAt ?? null,
        p_city_cursor_id: cursor?.city?.id ?? null,

        p_region_cursor_created_at: cursor?.region?.createdAt ?? null,
        p_region_cursor_id: cursor?.region?.id ?? null,

        p_country_cursor_created_at: cursor?.country?.createdAt ?? null,
        p_country_cursor_id: cursor?.country?.id ?? null,

        p_priority_cursor_created_at: cursor?.priority?.createdAt ?? null,
        p_priority_cursor_id: cursor?.priority?.id ?? null,

        p_world_cursor_created_at: cursor?.world?.createdAt ?? null,
        p_world_cursor_id: cursor?.world?.id ?? null
    })

    if (error) {
        console.error("GEO FEED LOAD ERROR:", error)

        return {
            success: false,
            error: "Не удалось загрузить ленту"
        }
    }

    const buckets: Record<GeoLevel, Post[]> = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
    }

    for (const row of (data ?? []) as CandidateRow[]) {
        if (row.geo_level < 1 || row.geo_level > 5) continue

        buckets[row.geo_level as GeoLevel].push(row.post_data)
    }

    for (const level of LEVELS) {
        buckets[level.level].sort(comparePosts)
    }

    const consumed: Record<GeoLevel, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    }

    let selectedCount = 0
    let carry = 0

    for (const level of LEVELS) {
        const bucket = buckets[level.level]
        const target = level.quota + carry
        const take = Math.min(target, bucket.length)

        consumed[level.level] = take
        selectedCount += take
        carry = target - take
    }

    let missing = PAGE_SIZE - selectedCount

    if (missing > 0) {
        for (const level of LEVELS) {
            if (missing <= 0) break

            const bucket = buckets[level.level]
            const start = consumed[level.level]
            const available = bucket.length - start

            if (available <= 0) continue

            const take = Math.min(missing, available)

            consumed[level.level] += take
            missing -= take
        }
    }

    const selectedPosts = LEVELS.flatMap((level) => {
        return buckets[level.level].slice(0, consumed[level.level])
    })

    const nextCursor: GeoFeedCursor = {
        city: cursor?.city ?? null,
        region: cursor?.region ?? null,
        country: cursor?.country ?? null,
        priority: cursor?.priority ?? null,
        world: cursor?.world ?? null
    }

    for (const level of LEVELS) {
        const consumedCount = consumed[level.level]

        if (consumedCount === 0) continue

        const lastPost = buckets[level.level][consumedCount - 1]

        if (!lastPost) continue

        nextCursor[level.key] = {
            id: lastPost.id,
            createdAt: lastPost.created_at
        }
    }

    const hasMore = LEVELS.some((level) => {
        return buckets[level.level].length > consumed[level.level]
    })

    return {
        success: true,
        posts: selectedPosts,
        nextCursor: hasMore ? nextCursor : null
    }
}