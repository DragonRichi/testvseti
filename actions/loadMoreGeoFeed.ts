"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { getGeoFeed } from "@/lib/feed/getGeoFeed"
import { getGeoFeedItems } from "@/lib/feed/getGeoFeedItems"
import type { GeoFeedCursor, GeoFeedItem } from "@/types/geoFeed"

type Result =
    | {
        success: true
        items: GeoFeedItem[]
        likedCommentIds: string[]
        nextCursor: GeoFeedCursor | null
    }
    | {
        success: false
        error: string
    }

export async function loadMoreGeoFeed(cursor: GeoFeedCursor): Promise<Result> {
    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const result = await getGeoFeed({
        cursor
    })

    if (result.success === false) {
        return result
    }

    const hydrated = await getGeoFeedItems(result.posts, user.id)

    return {
        success: true,
        items: hydrated.items,
        likedCommentIds: hydrated.likedCommentIds,
        nextCursor: result.nextCursor
    }
}