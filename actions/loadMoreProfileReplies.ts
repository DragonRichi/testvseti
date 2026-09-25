"use server"

import { loadProfileRepliesPage } from "@/lib/profile/loadProfileRepliesPage"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type { ProfileRepliesCursor, ProfileReplyItem } from "@/types/profileContent"

type Result =
    | {
        success: true
        items: ProfileReplyItem[]
        nextCursor: ProfileRepliesCursor | null
    }
    | {
        success: false
        error: string
    }

export async function loadMoreProfileReplies(
    profileId: string,
    cursor: ProfileRepliesCursor
): Promise<Result> {
    if (
        !isUuid(profileId) ||
        !isUuid(cursor.id) ||
        Number.isNaN(
            Date.parse(
                cursor.createdAt
            )
        )
    ) {
        return {
            success: false,
            error: "Некорректная страница"
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
            await loadProfileRepliesPage({
                supabase,
                profileId,
                cursor
            })

        return {
            success: true,
            ...page
        }
    } catch (error) {
        console.error(
            "PROFILE REPLIES LOAD MORE ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось загрузить ответы"
        }
    }
}