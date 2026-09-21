"use client"

import { createClient } from "@/lib/supabase/client"
import type { UploadedGeoChatAttachment } from "@/types/geoChatAttachments"

export const GEO_CHAT_MAX_ATTACHMENTS = 5

export const GEO_CHAT_MAX_FILE_SIZE =
    10 * 1024 * 1024

export const GEO_CHAT_ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]

const MIME_EXTENSIONS: Record<
    string,
    string
> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
}

function validateFile(file: File) {
    if (!file.name.trim()) {
        throw new Error(
            "Некорректное имя изображения"
        )
    }

    if (file.name.length > 255) {
        throw new Error(
            `Слишком длинное имя файла: ${file.name}`
        )
    }

    if (
        !GEO_CHAT_ALLOWED_MIME_TYPES.includes(
            file.type
        )
    ) {
        throw new Error(
            `Файл "${file.name}" не является поддерживаемым изображением`
        )
    }

    if (file.size <= 0) {
        throw new Error(
            `Файл "${file.name}" пуст`
        )
    }

    if (
        file.size >
        GEO_CHAT_MAX_FILE_SIZE
    ) {
        throw new Error(
            `Изображение "${file.name}" превышает 10 МБ`
        )
    }
}

export async function removeGeoChatMedia(
    paths: string[]
) {
    const normalizedPaths = [
        ...new Set(
            paths
                .map((path) =>
                    path.trim()
                )
                .filter(Boolean)
        )
    ]

    if (
        normalizedPaths.length === 0
    ) {
        return
    }

    const supabase =
        createClient()

    const { error } =
        await supabase.storage
            .from("geo-chat-media")
            .remove(
                normalizedPaths
            )

    if (error) {
        console.error(
            "GEO CHAT MEDIA REMOVE ERROR:",
            error
        )
    }
}

export async function uploadGeoChatMedia(
    files: File[],
    userId: string,
    chatId: string
): Promise<
    UploadedGeoChatAttachment[]
> {
    if (files.length === 0) {
        return []
    }

    if (
        files.length >
        GEO_CHAT_MAX_ATTACHMENTS
    ) {
        throw new Error(
            "Можно прикрепить не более 5 изображений"
        )
    }

    files.forEach(
        validateFile
    )

    const supabase =
        createClient()

    const uploaded:
        UploadedGeoChatAttachment[] = []

    try {
        for (const file of files) {
            const extension =
                MIME_EXTENSIONS[
                file.type
                ]

            const storagePath =
                `${userId}/${chatId}/${crypto.randomUUID()}.${extension}`

            const { error } =
                await supabase.storage
                    .from(
                        "geo-chat-media"
                    )
                    .upload(
                        storagePath,
                        file,
                        {
                            cacheControl:
                                "3600",
                            contentType:
                                file.type,
                            upsert: false
                        }
                    )

            if (error) {
                console.error(
                    "GEO CHAT IMAGE UPLOAD ERROR:",
                    error
                )

                throw new Error(
                    `Не удалось загрузить изображение "${file.name}"`
                )
            }

            uploaded.push({
                storagePath,
                fileName:
                    file.name,
                mimeType:
                    file.type,
                sizeBytes:
                    file.size
            })
        }

        return uploaded
    } catch (error) {
        if (
            uploaded.length > 0
        ) {
            await removeGeoChatMedia(
                uploaded.map(
                    (item) =>
                        item.storagePath
                )
            )
        }

        throw error
    }
}