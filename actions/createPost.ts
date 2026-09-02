"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    content: string
    username: string
    mediaUrls?: string[]
}

export async function createPost({ content, username, mediaUrls = [] }: Props) {
    const normalizedContent = content.trim()
    const normalizedMediaUrls = mediaUrls.filter((url) => url.trim().length > 0)

    if (!normalizedContent && normalizedMediaUrls.length === 0) {
        return {
            success: false,
            error: "Добавьте текст или фотографию"
        }
    }

    if (normalizedContent.length > 5000) {
        return {
            success: false,
            error: "Публикация не должна превышать 5000 символов"
        }
    }

    if (normalizedMediaUrls.length > 10) {
        return {
            success: false,
            error: "Можно добавить не более 10 фотографий"
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

        const { data: userLocation, error: locationError } = await supabase.from("user_locations").select("location,city,region,country_code").eq("user_id", user.id).maybeSingle()

        if (locationError) {
            console.error("POST LOCATION LOAD ERROR:", locationError)
        }

        const { data, error } = await supabase.from("posts").insert({
            user_id: user.id,
            content: normalizedContent || null,
            media_urls: normalizedMediaUrls.length > 0 ? normalizedMediaUrls : null,
            visibility: "all",
            city: userLocation?.city ?? null,
            region: userLocation?.region ?? null,
            country_code: userLocation?.country_code ?? null,
            created_location: userLocation?.location ?? null
        }).select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code").single()

        if (error) {
            console.error("POST CREATE ERROR:", error)

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
        console.error("POST CREATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка создания публикации"
        }
    }
}