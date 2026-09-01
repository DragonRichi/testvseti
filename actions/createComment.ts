"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
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

export async function createComment({ content, postId, username, parentId = null }: Props): Promise<CreateCommentResult> {
    const normalizedContent = content.trim()

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

    try {

        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                error: "Необходимо войти в аккаунт"
            }
        }

        const supabase = await createClient()

        const { data, error } = await supabase.from("post_comments").insert({
            post_id: postId,
            user_id: user.id,
            parent_id: parentId,
            content: normalizedContent
        }).select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").single()

        if (error) {
            console.error("COMMENT CREATE ERROR: ", error)

            return {
                success: false,
                error: "Не удалось добавить комментарий"
            }
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            error: null,
            comment: data
        }
    } catch (error) {
        console.error("COMMENT CREATE ERROR: ", error)
        return {
            success: false,
            error: "Ошибка создания комментария"
        }
    }
}