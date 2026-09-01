"use server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    commentId: string
    content: string
    username: string
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

export async function updateComment({ commentId, content, username }: Props): Promise<UpdateCommentResult> {
    const normalizedContent = content.trim()

    if (!commentId) {
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

    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                error: "Необходимо войти в аккаунт"
            }
        }

        const supabase = await createClient()
        const updatedAt = new Date().toISOString()

        const { data, error } = await supabase.from("post_comments").update({
            content: normalizedContent,
            updated_at: updatedAt
        }).eq("id", commentId).eq("user_id", user.id).select("id,content,updated_at").maybeSingle()

        if (error) {
            console.error("COMMENT UPDATE ERROR:", error)

            return {
                success: false,
                error: "Не удалось изменить комментарий"
            }
        }

        if (!data) {
            return {
                success: false,
                error: "Комментарий не найден или у вас нет прав на его редактирование"
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
        console.error("COMMENT UPDATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка редактирования комментария"
        }
    }
}