"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    commentId: string
    username: string
}

type RpcStatus = "ok" | "unauthorized" | "comment_not_found"

type RpcRow = {
    status: RpcStatus
    liked: boolean | null
    likes_count: number | null
}

type ToggleCommentLikeResult =
    | {
        success: true
        error: null
        liked: boolean
        likesCount: number
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function toggleCommentLike({ commentId, username }: Props): Promise<ToggleCommentLikeResult> {
    if (typeof commentId !== "string" || !uuidPattern.test(commentId)) {
        return {
            success: false,
            error: "Комментарий не найден"
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("toggle_comment_like", {
        p_comment_id: commentId
    })

    if (error) {
        console.error("COMMENT LIKE RPC ERROR:", error)

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

    if (row.status === "comment_not_found") {
        return {
            success: false,
            error: "Комментарий не найден"
        }
    }

    if (row.liked === null || row.likes_count === null) {
        console.error("COMMENT LIKE RPC INVALID RESPONSE:", row)

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
        likesCount: Number(row.likes_count)
    }
}