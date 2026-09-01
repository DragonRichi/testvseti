"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    postId: string
    username: string
}

type DeletePostResult =
    | {
        success: true
        error: null
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

export async function deletePost({ postId, username }: Props): Promise<DeletePostResult> {
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

        const { data: post, error: postError } = await supabase.from("posts").select("id,user_id,media_urls").eq("id", postId).maybeSingle()

        if (postError) {
            console.error("POST LOAD ERROR:", postError)

            return {
                success: false,
                error: "Не удалось получить публикацию"
            }
        }

        if (!post) {
            return {
                success: false,
                error: "Публикация не найдена"
            }
        }

        if (post.user_id !== user.id) {
            return {
                success: false,
                error: "Нет прав на удаление публикации"
            }
        }

        const mediaUrls: string[] = Array.isArray(post.media_urls) ? post.media_urls : []

        const mediaPaths = mediaUrls.map((url: string) => getStoragePath(url)).filter((path: string | null): path is string => path !== null)

        const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id)

        if (deleteError) {
            console.error("POST DELETE ERROR:", deleteError)

            return {
                success: false,
                error: "Не удалось удалить публикацию"
            }
        }

        if (mediaPaths.length > 0) {
            const { data: removedFiles, error: storageError } = await supabaseAdmin.storage.from("post-media").remove(mediaPaths)

            if (storageError) {
                console.error("POST MEDIA DELETE ERROR:", storageError)
            } else {
                console.log("POST MEDIA DELETE SUCCESS:", removedFiles)
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