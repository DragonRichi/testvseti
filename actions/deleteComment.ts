"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    commentId: string
    postId: string
    username: string
}

type RpcStatus = "ok" | "unauthorized" | "comment_not_found"

type RpcRow = {
    status: RpcStatus
    comment_count: number | string | null
}

type DeleteCommentResult =
    | {
        success: true
        error: null
        commentCount: number
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function deleteComment({ commentId, postId, username }: Props): Promise<DeleteCommentResult> {
    if (typeof commentId !== "string" || !uuidPattern.test(commentId) || typeof postId !== "string" || !uuidPattern.test(postId)) {
        return {
            success: false,
            error: "Комментарий не найден"
        }
    }

    const normalizedUsername = typeof username === "string" ? username.trim().replace(/^@+/, "").toLowerCase() : ""
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("delete_post_comment", {
        p_comment_id: commentId,
        p_post_id: postId
    })

    if (error) {
        console.error("COMMENT DELETE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось удалить комментарий"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось удалить комментарий"
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
            error: "Комментарий не найден или у вас нет прав на его удаление"
        }
    }

    if (row.comment_count === null) {
        console.error("COMMENT DELETE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось удалить комментарий"
        }
    }

    revalidatePath("/feed")

    if (normalizedUsername) {
        revalidatePath(`/profile/${normalizedUsername}`)
    }

    return {
        success: true,
        error: null,
        commentCount: Number(row.comment_count)
    }
}