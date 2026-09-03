"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
        isFollowing: boolean
    }
    | {
        success: false
        error: string
    }

export async function toggleFollowProfile(profileId: string, username: string, shouldFollow: boolean): Promise<Result> {
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

    if (user.id === profileId) {
        return {
            success: false,
            error: "Нельзя подписаться на самого себя"
        }
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", profileId).maybeSingle()

    if (profileError) {
        console.error("FOLLOW PROFILE LOAD ERROR:", profileError)

        return {
            success: false,
            error: "Не удалось проверить профиль"
        }
    }

    if (!profile) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    if (shouldFollow) {
        const { error } = await supabase.from("follows").upsert(
            {
                follower_id: user.id,
                following_id: profileId
            },
            {
                onConflict: "follower_id,following_id",
                ignoreDuplicates: true
            }
        )

        if (error) {
            console.error("FOLLOW PROFILE ERROR:", error)

            return {
                success: false,
                error: "Не удалось подписаться"
            }
        }
    } else {
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId)

        if (error) {
            console.error("UNFOLLOW PROFILE ERROR:", error)

            return {
                success: false,
                error: "Не удалось отписаться"
            }
        }
    }

    revalidatePath(`/profile/${username}`)

    return {
        success: true,
        isFollowing: shouldFollow
    }
}