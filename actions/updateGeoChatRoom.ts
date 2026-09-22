"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
        room: {
            name: string
            description: string | null
        }
    }
    | {
        success: false
        error: string
    }

export async function updateGeoChatRoom(
    chatId: string,
    name: string,
    description: string
): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    const normalizedName = name.trim()
    const normalizedDescription = description.trim()

    if (
        normalizedName.length < 1 ||
        normalizedName.length > 80
    ) {
        return {
            success: false,
            error: "Название должно содержать от 1 до 80 символов"
        }
    }

    if (normalizedDescription.length > 500) {
        return {
            success: false,
            error: "Описание не может быть длиннее 500 символов"
        }
    }

    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const {
        data: room,
        error: roomError
    } = await supabaseAdmin
        .from("geo_chats")
        .select("id,creator_id")
        .eq("id", chatId)
        .maybeSingle()

    if (roomError) {
        console.error(
            "GEO CHAT UPDATE LOAD ERROR:",
            roomError
        )

        return {
            success: false,
            error: "Не удалось загрузить геочат"
        }
    }

    if (!room) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    const adminMode =
        await hasGeoChatAdminMode()

    const canManage =
        adminMode ||
        room.creator_id === user.id

    if (!canManage) {
        return {
            success: false,
            error: "Недостаточно прав"
        }
    }

    const {
        data: updatedRoom,
        error: updateError
    } = await supabaseAdmin
        .from("geo_chats")
        .update({
            name: normalizedName,
            description:
                normalizedDescription ||
                null
        })
        .eq("id", chatId)
        .select("name,description")
        .single()

    if (
        updateError ||
        !updatedRoom
    ) {
        console.error(
            "GEO CHAT UPDATE ERROR:",
            updateError
        )

        return {
            success: false,
            error: "Не удалось изменить геочат"
        }
    }

    revalidatePath("/geochats")
    revalidatePath(
        `/geochats/${chatId}`
    )

    return {
        success: true,
        room: {
            name:
                updatedRoom.name,
            description:
                updatedRoom.description
        }
    }
}