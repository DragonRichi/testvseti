"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    username: string
}

type TogglePostLikeResult =
    | {
        success: true,
        error: null
        liked: boolean
        likeCount: number
    }
    |
    {
        success: false
        error: string
    }


export async function togglePostLike({ postId, username }: Props): Promise<TogglePostLikeResult> {

    if (!postId) {
        return {
            success: false,
            error: "Публикация не найдена"
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

        const { data: existingLike, error: likeCheckError } = await supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle()

        if (likeCheckError) {
            console.error("POST LIKE CHECK ERROR: ", likeCheckError)
            return {
                success: false,
                error: "Не удалось проверить лайк"
            }
        }

        let liked: boolean

        if (existingLike) {
            const { error: deleteError } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)

            if (deleteError) {
                console.error("POST UNLIKE ERROR: ", deleteError)
                return {
                    success: false,
                    error: "Не удалось убрать лайк"
                }
            }
            liked = false
        } else {
            const { error: insertError } = await supabase.from("post_likes").insert({
                post_id: postId,
                user_id: user.id
            })

            if (insertError) {
                console.error("POST LIKE ERROR: ", insertError)
                return {
                    success: false,
                    error: "Не удалось поставить лайк"
                }
            }
            liked = true
        }

        const { data: post, error: errorPost } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle()

        if (errorPost) {
            console.error("POST LIKE COUNT ERROR: ", errorPost)
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            error: null,
            liked,
            likeCount: post?.like_count ?? 0
        }

    } catch (error) {
        console.error("POST LIKE ERROR: ", error)
        return {
            success: false,
            error: "Ошибка обработки лайка"
        }
    }

}