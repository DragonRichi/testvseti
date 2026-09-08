"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { getGeoFeed } from "@/lib/feed/getGeoFeed"
import { getGeoFeedItems } from "@/lib/feed/getGeoFeedItems"
import type {
    GeoFeedCursor,
    GeoFeedItem,
    GeoFeedPointCursor
} from "@/types/geoFeed"

type Result =
    | {
        success: true
        items: GeoFeedItem[]
        nextCursor: GeoFeedCursor | null
    }
    | {
        success: false
        error: string
    }

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidPointCursor(
    value:
        GeoFeedPointCursor |
        null
) {
    if (value === null) {
        return true
    }

    if (
        !value ||
        typeof value !== "object"
    ) {
        return false
    }

    if (
        typeof value.id !==
        "string" ||
        !uuidPattern.test(
            value.id
        )
    ) {
        return false
    }

    if (
        value.createdAt !==
        null &&
        (
            typeof value.createdAt !==
            "string" ||
            Number.isNaN(
                Date.parse(
                    value.createdAt
                )
            )
        )
    ) {
        return false
    }

    return true
}

function isValidCursor(
    cursor: GeoFeedCursor
) {
    if (
        !cursor ||
        typeof cursor !==
        "object"
    ) {
        return false
    }

    return (
        isValidPointCursor(
            cursor.city
        ) &&
        isValidPointCursor(
            cursor.region
        ) &&
        isValidPointCursor(
            cursor.country
        ) &&
        isValidPointCursor(
            cursor.priority
        ) &&
        isValidPointCursor(
            cursor.world
        )
    )
}

export async function loadMoreGeoFeed(
    cursor: GeoFeedCursor
): Promise<Result> {
    if (!isValidCursor(cursor)) {
        return {
            success: false,
            error: "Некорректный курсор ленты"
        }
    }

    const user =
        await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const result =
        await getGeoFeed({
            cursor
        })

    if (
        result.success === false
    ) {
        return result
    }

    const hydrated =
        await getGeoFeedItems(
            result.posts,
            user.id
        )

    if (
        hydrated.success === false
    ) {
        return hydrated
    }

    return {
        success: true,
        items: hydrated.items,
        nextCursor:
            result.nextCursor
    }
}