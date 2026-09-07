"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    username: string
}

type RpcStatus = "ok" | "unauthorized" | "post_not_found"

type RpcRow = {
    status: RpcStatus
    liked: boolean | null
    like_count: number | string | null
}

type TogglePostLikeResult =
    | {
        success: true
        error: null
        liked: boolean
        likeCount: number
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function togglePostLike({ postId, username }: Props): Promise<TogglePostLikeResult> {
    if (typeof postId !== "string" || !uuidPattern.test(postId)) {
        return {
            success: false,
            error: "Публикация не найдена"
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("toggle_post_like", {
        p_post_id: postId
    })

    if (error) {
        console.error("POST LIKE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось обработать лайк"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось обработать лайк"
        }
    }

    if (row.status === "unauthorized") {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    if (row.status === "post_not_found") {
        return {
            success: false,
            error: "Публикация не найдена"
        }
    }

    if (row.liked === null || row.like_count === null) {
        console.error("POST LIKE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось обработать лайк"
        }
    }

    revalidatePath("/feed")

    if (typeof username === "string" && username.trim()) {
        revalidatePath(`/profile/${username.trim().toLowerCase()}`)
    }

    return {
        success: true,
        error: null,
        liked: row.liked,
        likeCount: Number(row.like_count)
    }
}