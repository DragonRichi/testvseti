"use server"

import { getRadarFeed } from "@/lib/radars/getRadarFeed"
import { getRadarFeedItems } from "@/lib/radars/getRadarFeedItems"
import type { RadarFeedCursor, RadarFeedItem } from "@/types/radar"

type Result =
    | {
        success: true
        items: RadarFeedItem[]
        likedCommentIds: string[]
        nextCursor: RadarFeedCursor | null
    }
    | {
        success: false
        error: string
    }

export async function loadMoreRadarFeed(radarId: string, cursor: RadarFeedCursor): Promise<Result> {
    const result = await getRadarFeed(radarId, {
        limit: 20,
        cursor
    })

    if (result.success === false) {
        return result
    }

    const hydrated = await getRadarFeedItems(result.posts, result.radar.user_id)

    return {
        success: true,
        items: hydrated.items,
        likedCommentIds: hydrated.likedCommentIds,
        nextCursor: result.nextCursor
    }
}