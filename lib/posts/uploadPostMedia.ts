import { createClient } from "../supabase/client"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]

type UploadedMedia = {
    url: string
    path: string
}

export async function uploadPostMedia(files: File[], userId: string): Promise<UploadedMedia[]> {
    if (files.length === 0) return []

    const supabase = createClient()
    const uploadedMedia: UploadedMedia[] = []

    for (const file of files) {

        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`Файл "${file.name}" имеет неподдерживаемый формат`)
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Файл "${file.name} превышает 10 МБ"`)
        }

        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `${crypto.randomUUID()}.${extension}`
        const path = `${userId}/${fileName}`


        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file, {
            cacheControl: "3600",
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

    const supabase = createClient()

    const { error } = await (await supabase).storage.from("post-media").remove(paths)

    if (error) {
        console.error("POST MEDIA REMOVE ERROR:", error)
    }
}