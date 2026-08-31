"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    username: string
}

export async function deletePost({ postId, username }: Props) {
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

        const { data: post, error: postError } = await supabase.from("posts").select("id,user_id").eq("id", postId).eq("user_id", user.id).maybeSingle()

        if (postError) {
            console.error("POST CHECK ERROR:", postError)

            return {
                success: false,
                error: "Не удалось проверить публикацию"
            }
        }

        if (!post) {
            return {
                success: false,
                error: "Публикация не найдена или у вас нет прав на её удаление"
            }
        }

        const { error: deleteError } = await supabase.from("posts").delete().eq("id", post.id).eq("user_id", user.id)

        if (deleteError) {
            console.error("POST DELETE ERROR:", deleteError)

            return {
                success: false,
                error: "Не удалось удалить публикацию"
            }
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            error: null
        }
    } catch (error) {
        console.error("POST DELETE ERROR:", error)

        return {
            success: false,
            error: "Ошибка удаления публикации"
        }
    }
}