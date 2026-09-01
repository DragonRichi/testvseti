"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    commentId: string
    postId: string
    username: string
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

export async function deleteComment({ commentId, postId, username }: Props): Promise<DeleteCommentResult> {
    if (!commentId || !postId) {
        return {
            success: false,
            error: "Комментарий не найден"
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
        const { data: comment, error: commentError } = await supabase.from("post_comments").select("id,user_id").eq("id", commentId).eq("post_id", postId).eq("user_id", user.id).maybeSingle()

        if (commentError) {
            console.error("COMMENT CHECK ERROR:", commentError)

            return {
                success: false,
                error: "Не удалось проверить комментарий"
            }
        }

        if (!comment) {
            return {
                success: false,
                error: "Комментарий не найден или у вас нет прав на его удаление"
            }
        }

        const { error: deleteError } = await supabase.from("post_comments").delete().eq("id", comment.id).eq("user_id", user.id)

        if (deleteError) {
            console.error("COMMENT DELETE ERROR:", deleteError)

            return {
                success: false,
                error: "Не удалось удалить комментарий"
            }
        }

        const { data: post, error: postError } = await supabase.from("posts").select("comment_count").eq("id", postId).maybeSingle()

        if (postError) {
            console.error("COMMENT COUNT LOAD ERROR:", postError)
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)
        return {
            success: true,
            error: null,
            commentCount: post?.comment_count ?? 0
        }
    } catch (error) {
        console.error("COMMENT COUNT LOAD ERROR:", error)
        return {
            success: false,
            error: "Ошибка удаления комментария"
        }
    }
}