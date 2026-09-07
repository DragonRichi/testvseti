"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    commentId: string
    content: string
    username: string
}

type RpcStatus = "ok" | "unauthorized" | "empty" | "too_long" | "comment_not_found" | "not_owner"

type RpcRow = {
    status: RpcStatus
    id: string | null
    content: string | null
    updated_at: string | null
}

type UpdateCommentResult =
    | {
        success: true
        error: null
        comment: {
            id: string
            content: string
            updated_at: string
        }
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getRpcError(status: RpcStatus) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "empty") return "Введите комментарий"
    if (status === "too_long") return "Комментарий не должен превышать 2000 символов"
    if (status === "comment_not_found") return "Комментарий не найден"
    if (status === "not_owner") return "Можно изменять только свои комментарии"

    return "Не удалось изменить комментарий"
}

export async function updateComment({ commentId, content, username }: Props): Promise<UpdateCommentResult> {
    const normalizedContent = typeof content === "string" ? content.trim() : ""
    const normalizedUsername = typeof username === "string" ? username.trim().replace(/^@+/, "").toLowerCase() : ""

    if (typeof commentId !== "string" || !uuidPattern.test(commentId)) {
        return {
            success: false,
            error: "Комментарий не найден"
        }
    }

    if (!normalizedContent) {
        return {
            success: false,
            error: "Введите комментарий"
        }
    }

    if (normalizedContent.length > 2000) {
        return {
            success: false,
            error: "Комментарий не должен превышать 2000 символов"
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("update_post_comment", {
        p_comment_id: commentId,
        p_content: normalizedContent
    })

    if (error) {
        console.error("COMMENT UPDATE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось изменить комментарий"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось изменить комментарий"
        }
    }

    if (row.status !== "ok") {
        return {
            success: false,
            error: getRpcError(row.status)
        }
    }

    if (!row.id || row.content === null || !row.updated_at) {
        console.error("COMMENT UPDATE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось изменить комментарий"
        }
    }

    revalidatePath("/feed")

    if (normalizedUsername) {
        revalidatePath(`/profile/${normalizedUsername}`)
    }

    return {
        success: true,
        error: null,
        comment: {
            id: row.id,
            content: row.content,
            updated_at: row.updated_at
        }
    }
}