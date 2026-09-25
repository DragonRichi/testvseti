"use server"

import { loadProfilePostsPage } from "@/lib/profile/loadProfilePostsPage"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type { ProfilePostMode, ProfilePostsCursor } from "@/types/profileContent"
import type { Post } from "@/types/social"

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

function isValidCursor(
    cursor: ProfilePostsCursor
) {
    return (
        typeof cursor.createdAt ===
        "string" &&
        !Number.isNaN(
            Date.parse(
                cursor.createdAt
            )
        ) &&
        isUuid(cursor.id)
    )
}

export async function loadMoreProfilePosts(
    profileId: string,
    cursor: ProfilePostsCursor,
    mode: ProfilePostMode = "posts"
): Promise<Result> {
    if (!isUuid(profileId)) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    if (!isValidCursor(cursor)) {
        return {
            success: false,
            error: "Некорректная страница"
        }
    }

    if (
        mode !== "posts" &&
        mode !== "media"
    ) {
        return {
            success: false,
            error: "Некорректный раздел"
        }
    }

    const supabase =
        await createClient()

    const {
        data: { user },
        error: userError
    } =
        await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    try {
        const page =
            await loadProfilePostsPage({
                supabase,
                profileId,
                viewerId:
                    user.id,
                mode,
                cursor
            })

        return {
            success: true,
            ...page
        }
    } catch (error) {
        console.error(
            "PROFILE POSTS LOAD MORE ERROR:",
            error
        )

        return {
            success: false,
            error:
                mode === "media"
                    ? "Не удалось загрузить медиафайлы"
                    : "Не удалось загрузить публикации"
        }
    }
}