"use server"

import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/types/social"

const PROFILE_POSTS_PAGE_SIZE = 10
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ProfilePostsCursor = {
    createdAt: string
    id: string
}

type Result =
    | {
        success: true
        posts: Post[]
        likedPostIds: string[]
        nextCursor: ProfilePostsCursor | null
    }
    | {
        success: false
        error: string
    }

export async function loadMoreProfilePosts(
    profileId: string,
    cursor: ProfilePostsCursor
): Promise<Result> {
    if (
        typeof profileId !== "string" ||
        !uuidPattern.test(profileId)
    ) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    if (
        !cursor ||
        typeof cursor.createdAt !== "string" ||
        Number.isNaN(Date.parse(cursor.createdAt)) ||
        typeof cursor.id !== "string" ||
        !uuidPattern.test(cursor.id)
    ) {
        return {
            success: false,
            error: "Некорректная страница"
        }
    }

    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const { data, error } = await supabase
        .from("posts")
        .select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code,tagged_location_name,tagged_lat,tagged_lon,tagged_city,tagged_region,tagged_country_code")
        .eq("user_id", profileId)
        .or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PROFILE_POSTS_PAGE_SIZE + 1)

    if (error) {
        console.error("PROFILE POSTS LOAD MORE ERROR:", error)

        return {
            success: false,
            error: "Не удалось загрузить публикации"
        }
    }

    const fetchedPosts = (data ?? []) as Post[]

    const hasMore =
        fetchedPosts.length > PROFILE_POSTS_PAGE_SIZE

    const posts = fetchedPosts.slice(
        0,
        PROFILE_POSTS_PAGE_SIZE
    )

    const postIds = posts.map(
        (post) => post.id
    )

    let likedPostIds: string[] = []

    if (postIds.length > 0) {
        const {
            data: likedPosts,
            error: likedPostsError
        } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postIds)

        if (likedPostsError) {
            console.error(
                "PROFILE POSTS LIKES LOAD MORE ERROR:",
                likedPostsError
            )
        } else {
            likedPostIds = (likedPosts ?? []).map(
                (like) => like.post_id
            )
        }
    }

    const lastPost = posts.at(-1)

    const nextCursor: ProfilePostsCursor | null =
        hasMore &&
        lastPost &&
        typeof lastPost.created_at === "string"
            ? {
                createdAt: lastPost.created_at,
                id: lastPost.id
            }
            : null

    return {
        success: true,
        posts,
        likedPostIds,
        nextCursor
    }
}