"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    content: string
    username: string
    parentId?: string | null
}

type CreatedComment = {
    id: string
    post_id: string
    user_id: string
    parent_id: string | null
    content: string
    media_url: string | null
    likes_count: number
    created_at: string
    updated_at: string
}

type RpcStatus = "ok" | "unauthorized" | "empty" | "too_long" | "post_not_found" | "parent_not_found"

type RpcRow = {
    status: RpcStatus
    id: string | null
    post_id: string | null
    user_id: string | null
    parent_id: string | null
    content: string | null
    media_url: string | null
    likes_count: number | string | null
    created_at: string | null
    updated_at: string | null
}

type CreateCommentResult =
    | {
        success: true
        error: null
        comment: CreatedComment
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
    if (status === "post_not_found") return "Публикация не найдена"
    if (status === "parent_not_found") return "Комментарий, на который вы отвечаете, не найден"

    return "Не удалось добавить комментарий"
}

export async function createComment({ content, postId, username, parentId = null }: Props): Promise<CreateCommentResult> {
    const normalizedContent = typeof content === "string" ? content.trim() : ""
    const normalizedUsername = typeof username === "string" ? username.trim().replace(/^@+/, "").toLowerCase() : ""

    if (typeof postId !== "string" || !uuidPattern.test(postId)) {
        return {
            success: false,
            error: "Публикация не найдена"
        }
    }

    if (parentId !== null && (typeof parentId !== "string" || !uuidPattern.test(parentId))) {
        return {
            success: false,
            error: "Комментарий, на который вы отвечаете, не найден"
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

    const { data, error } = await supabase.rpc("create_post_comment", {
        p_post_id: postId,
        p_content: normalizedContent,
        p_parent_id: parentId
    })

    if (error) {
        console.error("COMMENT CREATE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось добавить комментарий"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось добавить комментарий"
        }
    }

    if (row.status !== "ok") {
        return {
            success: false,
            error: getRpcError(row.status)
        }
    }

    if (!row.id || !row.post_id || !row.user_id || row.content === null || !row.created_at || !row.updated_at) {
        console.error("COMMENT CREATE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось добавить комментарий"
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
            post_id: row.post_id,
            user_id: row.user_id,
            parent_id: row.parent_id,
            content: row.content,
            media_url: row.media_url,
            likes_count: Number(row.likes_count ?? 0),
            created_at: row.created_at,
            updated_at: row.updated_at
        }
    }
}