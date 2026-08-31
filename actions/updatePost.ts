"use server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    content: string
    username: string
}

export async function updatePost({ content, username, postId }: Props) {

    const normalizedContent = content.trim()

    if (!postId) {
        return {
            success: false,
            error: "Публикация не найдена"
        }
    }

    if (!normalizedContent) {
        return {
            success: false,
            error: "Введите текст публикации"
        }
    }

    if (normalizedContent.length > 5000) {
        return {
            success: false,
            error: "Публикация не должна превышать 5000 символов"
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

        const { data, error } = await supabase.from("posts").update({ content: normalizedContent }).eq("id", postId).eq("user_id", user.id).select("id,content").maybeSingle()

        if (error) {
            console.error("POST UPDATE ERROR: ", error)

            return {
                success: false,
                error: "Не удалось создать публикацию"
            }
        }

        if (!data) {
            return {
                success: false,
                error: "Публикация не найдена или у вас нет прав на её редактирование"
            }
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            error: null,
            post: data
        }

    } catch (error) {
        console.error("POST UPDATE ERROR: ", error)

        return {
            success: false,
            error: "Ошибка создания публикации"
        }
    }

}