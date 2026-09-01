"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    content: string
    username: string
    mediaUrls?: string[]
}

type UpdatePostResult =
    | {
        success: true
        error: null
        post: {
            id: string
            content: string | null
            media_urls: string[] | null
        }
    }
    | {
        success: false
        error: string
    }

function getStoragePath(url: string) {
    const marker = "/storage/v1/object/public/post-media/"
    const markerIndex = url.indexOf(marker)

    if (markerIndex === -1) return null

    const path = url.slice(markerIndex + marker.length)

    if (!path) return null

    return decodeURIComponent(path)
}

export async function updatePost({ content, username, postId, mediaUrls = [] }: Props): Promise<UpdatePostResult> {
    const normalizedContent = content.trim()
    const normalizedMediaUrls = [...new Set(mediaUrls.filter((url) => url.trim().length > 0))]

    if (!postId) {
        return {
            success: false,
            error: "Публикация не найдена"
        }
    }

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

        const { data: existingPost, error: existingPostError } = await supabase.from("posts").select("id,user_id,media_urls").eq("id", postId).maybeSingle()

        if (existingPostError) {
            console.error("POST LOAD ERROR:", existingPostError)

            return {
                success: false,
                error: "Не удалось получить публикацию"
            }
        }

        if (!existingPost || existingPost.user_id !== user.id) {
            return {
                success: false,
                error: "Публикация не найдена или у вас нет прав на её редактирование"
            }
        }

        const existingMediaUrls: string[] = Array.isArray(existingPost.media_urls) ? existingPost.media_urls : []

        for (const url of normalizedMediaUrls) {
            const path = getStoragePath(url)

            if (!path || !path.startsWith(`${user.id}/`)) {
                return {
                    success: false,
                    error: "Некорректный файл публикации"
                }
            }
        }

        const removedMediaUrls = existingMediaUrls.filter((url) => !normalizedMediaUrls.includes(url))

        const { data, error } = await supabase.from("posts").update({
            content: normalizedContent || null,
            media_urls: normalizedMediaUrls.length > 0 ? normalizedMediaUrls : null
        }).eq("id", postId).eq("user_id", user.id).select("id,content,media_urls").maybeSingle()

        if (error) {
            console.error("POST UPDATE ERROR:", error)

            return {
                success: false,
                error: "Не удалось обновить публикацию"
            }
        }

        if (!data) {
            return {
                success: false,
                error: "Публикация не найдена или у вас нет прав на её редактирование"
            }
        }

        if (removedMediaUrls.length > 0) {
            const removedMediaPaths = removedMediaUrls.map((url) => getStoragePath(url)).filter((path): path is string => path !== null && path.startsWith(`${user.id}/`))

            if (removedMediaPaths.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage.from("post-media").remove(removedMediaPaths)

                if (storageError) {
                    console.error("POST MEDIA REMOVE ERROR:", storageError)
                }
            }
        }

        revalidatePath("/feed")
        revalidatePath(`/profile/${username}`)

        return {
            success: true,
            error: null,
            post: {
                id: data.id,
                content: data.content,
                media_urls: Array.isArray(data.media_urls) ? data.media_urls : null
            }
        }
    } catch (error) {
        console.error("POST UPDATE ERROR:", error)

        return {
            success: false,
            error: "Ошибка обновления публикации"
        }
    }
}