"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    commentId: string
    username: string
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

export async function toggleCommentLike({ commentId, username }: Props): Promise<ToggleCommentLikeResult> {
    if (!commentId) {
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

        const { data: comment, error: commentCheckError } = await supabase.from("post_comments").select("id").eq("id", commentId).maybeSingle()

        if (commentCheckError) {
            console.error("COMMENT CHECK ERROR:", commentCheckError)

            return {
                success: false,
                error: "Не удалось проверить комментарий"
            }
        }

        if (!comment) {
            return {
                success: false,
                error: "Комментарий не найден"
            }
        }

        const { data: existingLike, error: likeCheckError } = await supabase.from("comment_likes").select("comment_id").eq("comment_id", commentId).eq("user_id", user.id).maybeSingle()

        if (likeCheckError) {
            console.error("COMMENT LIKE CHECK ERROR:", likeCheckError)

            return {
                success: false,
                error: "Не удалось проверить лайк"
            }
        }

        let liked: boolean

        if (existingLike) {
            const { error: deleteError } = await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)

            if (deleteError) {
                console.error("COMMENT UNLIKE ERROR:", deleteError)

                return {
                    success: false,
                    error: "Не удалось убрать лайк"
                }
            }

            liked = false
        } else {
            const { error: insertError } = await supabase.from("comment_likes").insert({
                comment_id: commentId,
                user_id: user.id
            })

            if (insertError) {
                console.error("COMMENT LIKE ERROR:", insertError)

                return {
                    success: false,
                    error: "Не удалось поставить лайк"
                }
            }

            liked = true
        }

        const { data: updatedComment, error: updatedCommentError } = await supabase.from("post_comments").select("likes_count").eq("id", commentId).maybeSingle()

        if (updatedCommentError) {
            console.error("COMMENT LIKE COUNT ERROR:", updatedCommentError)

            return {
                success: false,
                error: "Не удалось получить количество лайков"
            }
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            error: null,
            liked,
            likesCount: Number(updatedComment?.likes_count ?? 0)
        }
    } catch (error) {
        console.error("COMMENT LIKE ERROR:", error)

        return {
            success: false,
            error: "Ошибка обработки лайка"
        }
    }
}