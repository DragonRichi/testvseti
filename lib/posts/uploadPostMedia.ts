import { createClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 10

const FILE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
}

type UploadedMedia = {
    url: string
    path: string
}

async function getCurrentUserId() {
    const supabase = createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Необходимо войти в аккаунт")
    }

    return {
        supabase,
        userId: user.id
    }
}

export async function uploadPostMedia(files: File[]): Promise<UploadedMedia[]> {
    if (files.length === 0) return []

    if (files.length > MAX_FILES) {
        throw new Error(`Можно загрузить не более ${MAX_FILES} фотографий`)
    }

    const { supabase, userId } = await getCurrentUserId()
    const uploadedMedia: UploadedMedia[] = []

    for (const file of files) {
        const extension = FILE_EXTENSIONS[file.type]

        if (!extension) {
            throw new Error(`Файл "${file.name}" имеет неподдерживаемый формат`)
        }

        if (file.size <= 0) {
            throw new Error(`Файл "${file.name}" пуст`)
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Файл "${file.name}" превышает 10 МБ`)
        }

        const fileName = `${crypto.randomUUID()}.${extension}`
        const path = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false
        })

        if (uploadError) {
            console.error("POST MEDIA UPLOAD ERROR:", uploadError)

            if (uploadedMedia.length > 0) {
                await supabase.storage.from("post-media").remove(uploadedMedia.map((item) => item.path))
            }

            throw new Error("Не удалось загрузить изображение")
        }

        const { data } = supabase.storage.from("post-media").getPublicUrl(path)

        uploadedMedia.push({
            url: data.publicUrl,
            path
        })
    }

    return uploadedMedia
}

export async function removePostMedia(paths: string[]) {
    if (paths.length === 0) return

    const { supabase, userId } = await getCurrentUserId()
    const userPrefix = `${userId}/`

    const ownedPaths = [...new Set(
        paths
            .filter((path): path is string => typeof path === "string")
            .map((path) => path.trim())
            .filter((path) => path.startsWith(userPrefix))
    )]

    if (ownedPaths.length === 0) return

    const { error } = await supabase.storage.from("post-media").remove(ownedPaths)

    if (error) {
        console.error("POST MEDIA REMOVE ERROR:", error)
    }
}