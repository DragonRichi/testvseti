"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type RpcStatus = "ok" | "unauthorized" | "profile_not_found" | "self_follow" | "invalid_action"

type RpcRow = {
    status: RpcStatus
    is_following: boolean | null
}

type Result =
    | {
        success: true
        isFollowing: boolean
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const usernamePattern = /^[a-z0-9_]{3,20}$/

function getRpcError(status: RpcStatus) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "profile_not_found") return "Профиль не найден"
    if (status === "self_follow") return "Нельзя подписаться на самого себя"
    if (status === "invalid_action") return "Некорректное действие"

    return "Не удалось изменить подписку"
}

export async function toggleFollowProfile(profileId: string, username: string, shouldFollow: boolean): Promise<Result> {
    if (typeof profileId !== "string" || !uuidPattern.test(profileId)) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    const normalizedUsername = typeof username === "string" ? username.trim().replace(/^@+/, "").toLowerCase() : ""

    if (!usernamePattern.test(normalizedUsername)) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    if (typeof shouldFollow !== "boolean") {
        return {
            success: false,
            error: "Некорректное действие"
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("set_profile_follow", {
        p_profile_id: profileId,
        p_should_follow: shouldFollow
    })

    if (error) {
        console.error("FOLLOW PROFILE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось изменить подписку"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось изменить подписку"
        }
    }

    if (row.status !== "ok") {
        return {
            success: false,
            error: getRpcError(row.status)
        }
    }

    if (row.is_following === null) {
        console.error("FOLLOW PROFILE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось изменить подписку"
        }
    }

    revalidatePath(`/profile/${normalizedUsername}`)
    revalidatePath("/contacts")

    return {
        success: true,
        isFollowing: row.is_following
    }
}