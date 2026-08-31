"use server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    content: string
    username: string
}

export async function createPost({ content, username }: Props) {

    const normalizedContent = content.trim()

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

        const { data, error } = await supabase.from("posts").insert({
            user_id: user.id,
            content: normalizedContent,
            visibility: "all"
        }).select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility").single()

        if (error) {
            console.error("POST CREATE ERROR: ", error)

            return {
                success: false,
                error: "Не удалось создать публикацию"
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
        console.error("POST CREATE ERROR: ", error)

        return {
            success: false,
            error: "Ошибка создания публикации"
        }
    }

}