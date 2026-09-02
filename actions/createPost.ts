"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type TaggedLocation = {
    name: string
    latitude: number
    longitude: number
}

type Props = {
    content: string
    username: string
    mediaUrls?: string[]
    taggedLocation?: TaggedLocation | null
}

export async function createPost({ content, username, mediaUrls = [], taggedLocation = null }: Props) {
    const normalizedContent = content.trim()
    const normalizedMediaUrls = mediaUrls.filter((url) => url.trim().length > 0)
    const normalizedLocationName = taggedLocation?.name.trim() ?? ""

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

    if (taggedLocation) {
        if (!normalizedLocationName) {
            return {
                success: false,
                error: "Укажите название места"
            }
        }

        if (normalizedLocationName.length > 100) {
            return {
                success: false,
                error: "Название места слишком длинное"
            }
        }

        if (!Number.isFinite(taggedLocation.latitude) || taggedLocation.latitude < -90 || taggedLocation.latitude > 90) {
            return {
                success: false,
                error: "Некорректная широта места"
            }
        }

        if (!Number.isFinite(taggedLocation.longitude) || taggedLocation.longitude < -180 || taggedLocation.longitude > 180) {
            return {
                success: false,
                error: "Некорректная долгота места"
            }
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

        const taggedLocationPoint = taggedLocation ? `POINT(${taggedLocation.longitude} ${taggedLocation.latitude})` : null

        const { data, error } = await supabase.from("posts").insert({
            user_id: user.id,
            content: normalizedContent || null,
            media_urls: normalizedMediaUrls.length > 0 ? normalizedMediaUrls : null,
            visibility: "all",
            city: userLocation?.city ?? null,
            region: userLocation?.region ?? null,
            country_code: userLocation?.country_code ?? null,
            created_location: userLocation?.location ?? null,
            tagged_location: taggedLocationPoint,
            tagged_location_name: taggedLocation ? normalizedLocationName : null
        }).select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code,tagged_location_name,tagged_lat,tagged_lon").single()

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