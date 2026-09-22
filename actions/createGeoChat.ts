"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
        chatId: string
    }
    | {
        success: false
        error: string
    }

type CreateRow = {
    status: string
    chat_id: string | null
    blocking_chat_id: string | null
    blocking_chat_name: string | null
    blocking_radius_m: number | null
}

const allowedRadii =
    new Set([
        3000,
        6000,
        9000,
        12000
    ])

function getCreateError(
    row: CreateRow | undefined
) {
    if (!row) {
        return "Не удалось создать геочат"
    }

    if (
        row.status ===
        "unauthorized"
    ) {
        return "Необходимо войти в аккаунт"
    }

    if (
        row.status ===
        "invalid_name"
    ) {
        return "Название должно содержать от 1 до 80 символов"
    }

    if (
        row.status ===
        "description_too_long"
    ) {
        return "Описание не может быть длиннее 500 символов"
    }

    if (
        row.status ===
        "invalid_radius"
    ) {
        return "Некорректный радиус"
    }

    if (
        row.status ===
        "location_missing"
    ) {
        return "Не удалось получить текущее местоположение"
    }

    if (
        row.status ===
        "location_stale"
    ) {
        return "Местоположение устарело. Обновите геопозицию и попробуйте ещё раз"
    }

    if (
        row.status ===
        "radius_occupied"
    ) {
        const radiusKm =
            row.blocking_radius_m
                ? row.blocking_radius_m /
                  1000
                : null

        if (
            row.blocking_chat_name &&
            radiusKm
        ) {
            return `Здесь уже действует геочат «${row.blocking_chat_name}» с радиусом ${radiusKm} км. Создать геочат такого же или меньшего радиуса здесь нельзя.`
        }

        return "В этой зоне уже существует геочат такого же или большего радиуса"
    }

    return "Не удалось создать геочат"
}

export async function createGeoChat(
    name: string,
    description: string,
    radiusM: number
): Promise<Result> {
    const normalizedName =
        name.trim()

    const normalizedDescription =
        description.trim()

    if (
        normalizedName.length < 1 ||
        normalizedName.length > 80
    ) {
        return {
            success: false,
            error: "Название должно содержать от 1 до 80 символов"
        }
    }

    if (
        normalizedDescription.length >
        500
    ) {
        return {
            success: false,
            error: "Описание не может быть длиннее 500 символов"
        }
    }

    if (
        !allowedRadii.has(
            radiusM
        )
    ) {
        return {
            success: false,
            error: "Некорректный радиус"
        }
    }

    const supabase =
        await createClient()

    const {
        data: {
            user
        },
        error:
            userError
    } =
        await supabase.auth.getUser()

    if (
        userError ||
        !user
    ) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const {
        data,
        error
    } = await supabase.rpc(
        "create_geo_chat_at_current_location",
        {
            p_name:
                normalizedName,
            p_description:
                normalizedDescription,
            p_radius_m:
                radiusM
        }
    )

    if (error) {
        console.error(
            "CREATE GEO CHAT RPC ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось создать геочат"
        }
    }

    const row =
        ((data ?? []) as CreateRow[])[0]

    if (
        !row ||
        row.status !== "ok" ||
        !row.chat_id
    ) {
        return {
            success: false,
            error:
                getCreateError(
                    row
                )
        }
    }

    revalidatePath(
        "/geochats"
    )

    return {
        success: true,
        chatId:
            row.chat_id
    }
}