"use server"

import { getRadarFeed } from "@/lib/radars/getRadarFeed"
import { getRadarFeedItems } from "@/lib/radars/getRadarFeedItems"
import { isUuid } from "@/lib/validation/uuid"
import type { RadarFeedCursor, RadarFeedItem } from "@/types/radar"

type Result =
    | { success: true; items: RadarFeedItem[]; nextCursor: RadarFeedCursor | null }
    | { success: false; error: string }

function isValidCursor(cursor: RadarFeedCursor) {
    if (!cursor || typeof cursor !== "object" || !isUuid(cursor.id)) return false
    if (cursor.createdAt !== null && (typeof cursor.createdAt !== "string" || Number.isNaN(Date.parse(cursor.createdAt)))) return false
    if (cursor.score !== null && (typeof cursor.score !== "number" || !Number.isFinite(cursor.score))) return false
    return true
}

export async function loadMoreRadarFeed(radarId: string, cursor: RadarFeedCursor): Promise<Result> {
    if (!isUuid(radarId)) return { success: false, error: "Радар не найден" }
    if (!isValidCursor(cursor)) return { success: false, error: "Некорректный курсор радара" }

    const result = await getRadarFeed(radarId, { limit: 20, cursor })

    if (result.success === false) return result

    const hydrated = await getRadarFeedItems(result.posts, result.radar.user_id)

    if (hydrated.success === false) return hydrated

    return {
        success: true,
        items: hydrated.items,
        nextCursor: result.nextCursor
    }
}
