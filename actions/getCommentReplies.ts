"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import {
    loadPagedCommentItems,
    POST_COMMENT_SELECT,
    type RawPostComment
} from "@/lib/comments/loadPagedCommentItems"
import { createClient } from "@/lib/supabase/server"
import type { CommentCursor, PagedPostComment } from "@/types/postComments"

type Result =
    | {
        success: true
        comments: PagedPostComment[]
        nextCursor: CommentCursor | null
        remainingCount: number
    }
    | {
        success: false
        error: string
        comments: []
        nextCursor: null
        remainingCount: 0
    }

type Props = {
    postId: string
    parentCommentId: string
    cursor?: CommentCursor | null
}

const REPLIES_PAGE_SIZE = 20

export async function getCommentReplies({
    postId,
    parentCommentId,
    cursor = null
}: Props): Promise<Result> {
    if (!postId || !parentCommentId) {
        return {
            success: false,
            error: "Комментарий не найден",
            comments: [],
            nextCursor: null,
            remainingCount: 0
        }
    }

    if (
        cursor &&
        (
            !cursor.id ||
            !cursor.createdAt ||
            Number.isNaN(Date.parse(cursor.createdAt))
        )
    ) {
        return {
            success: false,
            error: "Некорректный курсор ответов",
            comments: [],
            nextCursor: null,
            remainingCount: 0
        }
    }

    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                error: "Необходимо войти в аккаунт",
                comments: [],
                nextCursor: null,
                remainingCount: 0
            }
        }

        const supabase = await createClient()

        let query = supabase
            .from("post_comments")
            .select(POST_COMMENT_SELECT, {
                count: "exact"
            })
            .eq("post_id", postId)
            .eq("parent_id", parentCommentId)

        if (cursor) {
            query = query.or(
                `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`
            )
        }

        const {
            data,
            count,
            error
        } = await query
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .limit(REPLIES_PAGE_SIZE)

        if (error) {
            console.error("COMMENT REPLIES LOAD ERROR:", error)

            return {
                success: false,
                error: "Не удалось загрузить ответы",
                comments: [],
                nextCursor: null,
                remainingCount: 0
            }
        }

        const rawReplies = (data ?? []) as RawPostComment[]

        const comments = await loadPagedCommentItems(
            supabase,
            user.id,
            rawReplies
        )

        const matchedCount = count ?? rawReplies.length

        const remainingCount = Math.max(
            0,
            matchedCount - rawReplies.length
        )

        const lastReply = rawReplies.at(-1)

        const nextCursor: CommentCursor | null =
            remainingCount > 0 && lastReply
                ? {
                    createdAt: lastReply.created_at,
                    id: lastReply.id
                }
                : null

        return {
            success: true,
            comments,
            nextCursor,
            remainingCount
        }
    } catch (error) {
        console.error("COMMENT REPLIES LOAD ERROR:", error)

        return {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Ошибка загрузки ответов",
            comments: [],
            nextCursor: null,
            remainingCount: 0
        }
    }
}