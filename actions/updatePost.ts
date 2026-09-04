"use server"

import { reverseGeocodePoint } from "@/actions/reverseGeocodePoint"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type TaggedLocation = {
    name: string
    latitude: number
    longitude: number
}

type Props = {
    postId: string
    content: string
    username: string
    mediaUrls?: string[]
    taggedLocation?: TaggedLocation | null
}

type Result =
    | {
        success: true
        post: {
            id: string
            user_id: string
            content: string | null
            media_urls: string[] | null
            comment_count: number | null
            like_count: number | null
            view_count: number | null
            share_count: number | null
            created_at: string | null
            visibility: string | null
            city: string | null
            region: string | null
            country_code: string | null
            tagged_location_name: string | null
            tagged_lat: number | null
            tagged_lon: number | null
            tagged_city: string | null
            tagged_region: string | null
            tagged_country_code: string | null
        }
    }
    | {
        success: false
        error: string
    }

export async function updatePost({ postId, content, username, mediaUrls = [], taggedLocation = null }: Props): Promise<Result> {
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

        const { data: existingPost, error: existingPostError } = await supabase.from("posts").select("id,user_id").eq("id", postId).maybeSingle()

        if (existingPostError) {
            console.error("POST UPDATE LOAD ERROR:", existingPostError)

            return {
                success: false,
                error: "Не удалось загрузить публикацию"
            }
        }

        if (!existingPost || existingPost.user_id !== user.id) {
            return {
                success: false,
                error: "Публикация не найдена"
            }
        }

        let taggedCity: string | null = null
        let taggedRegion: string | null = null
        let taggedCountryCode: string | null = null

        if (taggedLocation) {
            const taggedGeoResult = await reverseGeocodePoint({
                latitude: taggedLocation.latitude,
                longitude: taggedLocation.longitude
            })

            if (taggedGeoResult.success === false) {
                return {
                    success: false,
                    error: "Не удалось определить географию выбранного места. Попробуйте выбрать точку ещё раз"
                }
            }

            taggedCity = taggedGeoResult.city
            taggedRegion = taggedGeoResult.region
            taggedCountryCode = taggedGeoResult.countryCode

            if (!taggedCountryCode) {
                return {
                    success: false,
                    error: "Не удалось определить страну выбранного места"
                }
            }
        }

        const taggedLocationPoint = taggedLocation ? `POINT(${taggedLocation.longitude} ${taggedLocation.latitude})` : null

        const { data, error } = await supabase
            .from("posts")
            .update({
                content: normalizedContent || null,
                media_urls: normalizedMediaUrls.length > 0 ? normalizedMediaUrls : null,
                tagged_location: taggedLocationPoint,
                tagged_location_name: taggedLocation ? normalizedLocationName : null,
                tagged_city: taggedLocation ? taggedCity : null,
                tagged_region: taggedLocation ? taggedRegion : null,
                tagged_country_code: taggedLocation ? taggedCountryCode : null
            })
            .eq("id", postId)
            .eq("user_id", user.id)
            .select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code,tagged_location_name,tagged_lat,tagged_lon,tagged_city,tagged_region,tagged_country_code")
            .single()

        if (error || !data) {
            console.error("POST UPDATE ERROR:", error)

            return {
                success: false,
                error: "Не удалось обновить публикацию"
            }
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            post: data
        }
    } catch (error) {
        console.error("POST UPDATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка обновления публикации"
        }
    }
}