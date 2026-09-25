import "server-only"

import type { ProfilePostMode, ProfilePostsCursor } from "@/types/profileContent"
import type { Post } from "@/types/social"
import type { SupabaseClient } from "@supabase/supabase-js"

const PAGE_SIZE = 10

const POST_SELECT =
    "id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code,tagged_location_name,tagged_lat,tagged_lon,tagged_city,tagged_region,tagged_country_code"

type Props = {
    supabase: SupabaseClient
    profileId: string
    viewerId: string
    mode: ProfilePostMode
    cursor?: ProfilePostsCursor | null
}

export async function loadProfilePostsPage({
    supabase,
    profileId,
    viewerId,
    mode,
    cursor = null
}: Props) {
    let query = supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("user_id", profileId)

    if (mode === "media") {
        query = query.not(
            "media_urls",
            "is",
            null
        )
    }

    if (cursor) {
        query = query.or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
    }

    const {
        data,
        error
    } = await query
        .order(
            "created_at",
            { ascending: false }
        )
        .order(
            "id",
            { ascending: false }
        )
        .limit(
            PAGE_SIZE + 1
        )

    if (error) {
        throw error
    }

    const fetchedPosts =
        (data ?? []) as Post[]

    const hasMore =
        fetchedPosts.length >
        PAGE_SIZE

    const posts =
        fetchedPosts.slice(
            0,
            PAGE_SIZE
        )

    const postIds =
        posts.map(
            (post) => post.id
        )

    let likedPostIds: string[] = []

    if (postIds.length > 0) {
        const {
            data: likedPosts,
            error: likedError
        } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq(
                "user_id",
                viewerId
            )
            .in(
                "post_id",
                postIds
            )

        if (likedError) {
            console.error(
                "PROFILE LIKES LOAD ERROR:",
                likedError
            )
        } else {
            likedPostIds =
                (likedPosts ?? []).map(
                    (item) =>
                        item.post_id
                )
        }
    }

    const lastPost =
        posts.at(-1)

    const nextCursor:
        ProfilePostsCursor | null =
        hasMore &&
            lastPost?.created_at
            ? {
                createdAt:
                    lastPost.created_at,
                id: lastPost.id
            }
            : null

    return {
        posts,
        likedPostIds,
        nextCursor
    }
}