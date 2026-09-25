"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Props = {
    displayName: string
    username: string
    bio: string
    birthDate: string
    locationLabel: string
    websiteUrl: string
    interests: string[]
    avatarUrl: string | null
    coverUrl: string | null
}

type Result =
    | {
        success: true
        username: string
    }
    | {
        success: false
        error: string
    }

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

function normalizeOptional(value: string) {
    const normalized = value.trim()
    return normalized || null
}

function normalizeWebsite(value: string) {
    const normalized = value.trim()

    if (!normalized) {
        return {
            success: true as const,
            value: null
        }
    }

    const candidate = /^https?:\/\//i.test(normalized)
        ? normalized
        : `https://${normalized}`

    try {
        const url = new URL(candidate)

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return {
                success: false as const,
                error: "Некорректная ссылка"
            }
        }

        return {
            success: true as const,
            value: url.toString()
        }
    } catch {
        return {
            success: false as const,
            error: "Некорректная ссылка"
        }
    }
}

function getOwnedStoragePath(
    url: string | null,
    userId: string
) {
    if (!url) return null

    const marker =
        "/storage/v1/object/public/avatars/"

    const markerIndex =
        url.indexOf(marker)

    if (markerIndex === -1) {
        return null
    }

    const encodedPath = url
        .slice(markerIndex + marker.length)
        .split("?")[0]

    try {
        const path =
            decodeURIComponent(encodedPath)

        return path.startsWith(`${userId}/`)
            ? path
            : null
    } catch {
        return null
    }
}

function isAllowedMediaUrl(
    value: string | null,
    currentValue: string | null,
    userId: string
) {
    if (value === null) return true
    if (value === currentValue) return true

    return Boolean(
        getOwnedStoragePath(
            value,
            userId
        )
    )
}

export async function updateProfile({
    displayName,
    username,
    bio,
    birthDate,
    locationLabel,
    websiteUrl,
    interests,
    avatarUrl,
    coverUrl
}: Props): Promise<Result> {
    const normalizedDisplayName =
        displayName.trim()

    const normalizedUsername =
        username
            .trim()
            .replace(/^@+/, "")
            .toLowerCase()

    const normalizedBio =
        normalizeOptional(bio)

    const normalizedLocation =
        normalizeOptional(
            locationLabel
        )

    if (
        normalizedDisplayName.length < 2 ||
        normalizedDisplayName.length > 50
    ) {
        return {
            success: false,
            error: "Имя должно содержать от 2 до 50 символов"
        }
    }

    if (
        !USERNAME_PATTERN.test(
            normalizedUsername
        )
    ) {
        return {
            success: false,
            error: "Имя пользователя: 3–20 символов, латинские буквы, цифры и _"
        }
    }

    if (
        normalizedBio &&
        normalizedBio.length > 500
    ) {
        return {
            success: false,
            error: "Описание не должно превышать 500 символов"
        }
    }

    if (
        normalizedLocation &&
        normalizedLocation.length > 100
    ) {
        return {
            success: false,
            error: "Местоположение слишком длинное"
        }
    }

    if (
        birthDate &&
        !/^\d{4}-\d{2}-\d{2}$/.test(
            birthDate
        )
    ) {
        return {
            success: false,
            error: "Некорректная дата рождения"
        }
    }

    if (
        birthDate &&
        birthDate >
        new Date()
            .toISOString()
            .slice(0, 10)
    ) {
        return {
            success: false,
            error: "Дата рождения не может быть в будущем"
        }
    }

    const normalizedInterests = [
        ...new Set(
            interests
                .map((item) =>
                    item.trim()
                )
                .filter(Boolean)
        )
    ]

    if (
        normalizedInterests.length > 10
    ) {
        return {
            success: false,
            error: "Можно добавить не более 10 интересов"
        }
    }

    if (
        normalizedInterests.some(
            (item) =>
                item.length > 30
        )
    ) {
        return {
            success: false,
            error: "Название интереса не должно превышать 30 символов"
        }
    }

    const website =
        normalizeWebsite(
            websiteUrl
        )

    if (!website.success) {
        return {
            success: false,
            error: website.error
        }
    }

    const supabase =
        await createClient()

    const {
        data: { user },
        error: userError
    } =
        await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const {
        data: currentProfile,
        error: currentError
    } = await supabaseAdmin
        .from("profiles")
        .select("username,avatar_url,cover_url")
        .eq("id", user.id)
        .single()

    if (
        currentError ||
        !currentProfile
    ) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    if (
        !isAllowedMediaUrl(
            avatarUrl,
            currentProfile.avatar_url,
            user.id
        ) ||
        !isAllowedMediaUrl(
            coverUrl,
            currentProfile.cover_url,
            user.id
        )
    ) {
        return {
            success: false,
            error: "Некорректное изображение профиля"
        }
    }

    if (
        normalizedUsername !==
        currentProfile.username
    ) {
        const {
            data: existingUsername,
            error: usernameError
        } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq(
                "username",
                normalizedUsername
            )
            .neq("id", user.id)
            .maybeSingle()

        if (usernameError) {
            return {
                success: false,
                error: "Не удалось проверить имя пользователя"
            }
        }

        if (existingUsername) {
            return {
                success: false,
                error: "Это имя пользователя уже занято"
            }
        }
    }

    const { error: updateError } =
        await supabaseAdmin
            .from("profiles")
            .update({
                username:
                    normalizedUsername,
                display_name:
                    normalizedDisplayName,
                avatar_url:
                    avatarUrl,
                cover_url:
                    coverUrl,
                bio:
                    normalizedBio,
                birth_date:
                    birthDate || null,
                location_label:
                    normalizedLocation,
                website_url:
                    website.value,
                interests:
                    normalizedInterests
            })
            .eq("id", user.id)

    if (updateError) {
        console.error(
            "PROFILE UPDATE ERROR:",
            updateError
        )

        if (
            updateError.code ===
            "23505"
        ) {
            return {
                success: false,
                error: "Это имя пользователя уже занято"
            }
        }

        return {
            success: false,
            error: "Не удалось сохранить профиль"
        }
    }

    const stalePaths = [
        avatarUrl !==
            currentProfile.avatar_url
            ? getOwnedStoragePath(
                currentProfile.avatar_url,
                user.id
            )
            : null,
        coverUrl !==
            currentProfile.cover_url
            ? getOwnedStoragePath(
                currentProfile.cover_url,
                user.id
            )
            : null
    ].filter(
        (path): path is string =>
            Boolean(path)
    )

    if (stalePaths.length > 0) {
        const { error } =
            await supabaseAdmin.storage
                .from("avatars")
                .remove(stalePaths)

        if (error) {
            console.error(
                "OLD PROFILE MEDIA REMOVE ERROR:",
                error
            )
        }
    }

    const {
        error: metadataError
    } =
        await supabase.auth.updateUser({
            data: {
                username:
                    normalizedUsername,
                display_name:
                    normalizedDisplayName
            }
        })

    if (metadataError) {
        console.error(
            "AUTH PROFILE METADATA UPDATE ERROR:",
            metadataError
        )
    }

    revalidatePath(
        `/profile/${currentProfile.username}`
    )

    revalidatePath(
        `/profile/${normalizedUsername}`
    )

    revalidatePath("/feed")
    revalidatePath("/contacts")
    revalidatePath(
        "/settings/profile"
    )

    return {
        success: true,
        username:
            normalizedUsername
    }
}