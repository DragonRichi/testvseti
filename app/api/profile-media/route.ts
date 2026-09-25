import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
} as const

const MAX_AVATAR_SIZE =
    5 * 1024 * 1024

const MAX_COVER_SIZE =
    10 * 1024 * 1024

type MediaKind =
    | "avatar"
    | "cover"

async function getUser() {
    const supabase =
        await createClient()

    const {
        data: { user },
        error
    } =
        await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

export async function POST(
    request: Request
) {
    const user =
        await getUser()

    if (!user) {
        return Response.json(
            {
                error: "Необходимо войти в аккаунт"
            },
            {
                status: 401
            }
        )
    }

    const formData =
        await request.formData()

    const kind =
        formData.get("kind")

    const file =
        formData.get("file")

    if (
        kind !== "avatar" &&
        kind !== "cover"
    ) {
        return Response.json(
            {
                error: "Некорректный тип изображения"
            },
            {
                status: 400
            }
        )
    }

    if (!(file instanceof File)) {
        return Response.json(
            {
                error: "Файл не выбран"
            },
            {
                status: 400
            }
        )
    }

    const extension =
        ALLOWED_TYPES[
        file.type as keyof typeof ALLOWED_TYPES
        ]

    if (!extension) {
        return Response.json(
            {
                error: "Поддерживаются JPG, PNG и WEBP"
            },
            {
                status: 400
            }
        )
    }

    const maxSize =
        kind === "avatar"
            ? MAX_AVATAR_SIZE
            : MAX_COVER_SIZE

    if (
        file.size <= 0 ||
        file.size > maxSize
    ) {
        return Response.json(
            {
                error:
                    kind === "avatar"
                        ? "Аватар не должен превышать 5 МБ"
                        : "Обложка не должна превышать 10 МБ"
            },
            {
                status: 400
            }
        )
    }

    const path =
        `${user.id}/${kind}/${crypto.randomUUID()}.${extension}`

    const bytes =
        new Uint8Array(
            await file.arrayBuffer()
        )

    const { error: uploadError } =
        await supabaseAdmin.storage
            .from("avatars")
            .upload(
                path,
                bytes,
                {
                    contentType:
                        file.type,
                    cacheControl:
                        "3600",
                    upsert: false
                }
            )

    if (uploadError) {
        console.error(
            "PROFILE MEDIA UPLOAD ERROR:",
            uploadError
        )

        return Response.json(
            {
                error: "Не удалось загрузить изображение"
            },
            {
                status: 500
            }
        )
    }

    const { data } =
        supabaseAdmin.storage
            .from("avatars")
            .getPublicUrl(path)

    return Response.json({
        path,
        url: data.publicUrl
    })
}

export async function DELETE(
    request: Request
) {
    const user =
        await getUser()

    if (!user) {
        return Response.json(
            {
                error: "Необходимо войти в аккаунт"
            },
            {
                status: 401
            }
        )
    }

    const body =
        await request.json() as {
            path?: unknown
        }

    const path =
        typeof body.path === "string"
            ? body.path
            : ""

    if (
        !path.startsWith(
            `${user.id}/`
        )
    ) {
        return Response.json(
            {
                error: "Некорректный путь"
            },
            {
                status: 400
            }
        )
    }

    const { error } =
        await supabaseAdmin.storage
            .from("avatars")
            .remove([path])

    if (error) {
        console.error(
            "PROFILE MEDIA REMOVE ERROR:",
            error
        )

        return Response.json(
            {
                error: "Не удалось удалить изображение"
            },
            {
                status: 500
            }
        )
    }

    return Response.json({
        success: true
    })
}