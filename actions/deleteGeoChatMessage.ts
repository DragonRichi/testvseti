"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

type DeleteRow = {
    status: string
    message_id: string | null
}

type AttachmentRow = {
    storage_path: string
}

type Result =
    | {
        success: true
        storageCleaned: boolean
    }
    | {
        success: false
        error: string
    }

function getDeleteError(status: string) {
    if (status === "unauthorized") {
        return "Необходимо войти в аккаунт"
    }

    if (status === "outside") {
        return "Вы находитесь вне зоны этого геочата"
    }

    if (status === "not_owner") {
        return "Нельзя удалить чужое сообщение"
    }

    if (status === "message_not_found") {
        return "Сообщение не найдено"
    }

    return "Не удалось удалить сообщение"
}

export async function deleteGeoChatMessage(
    chatId: string,
    messageId: string
): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    if (!isUuid(messageId)) {
        return {
            success: false,
            error: "Сообщение не найдено"
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
        data: attachmentData,
        error: attachmentError
    } = await supabaseAdmin
        .from("geo_chat_message_attachments")
        .select("storage_path")
        .eq("message_id", messageId)
        .eq("user_id", user.id)

    if (attachmentError) {
        console.error(
            "GEO CHAT DELETE ATTACHMENTS LOAD ERROR:",
            attachmentError
        )

        return {
            success: false,
            error: "Не удалось подготовить удаление сообщения"
        }
    }

    const attachmentRows =
        (attachmentData ?? []) as AttachmentRow[]

    const storagePaths = [
        ...new Set(
            attachmentRows
                .map((attachment) =>
                    attachment.storage_path.trim()
                )
                .filter(Boolean)
        )
    ]

    const { data, error } = await supabase.rpc(
        "delete_geo_chat_message",
        {
            p_chat_id: chatId,
            p_message_id: messageId
        }
    )

    if (error) {
        console.error(
            "GEO CHAT MESSAGE DELETE ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось удалить сообщение"
        }
    }

    const rows =
        (data ?? []) as DeleteRow[]

    const row = rows[0]

    if (!row || row.status !== "ok") {
        return {
            success: false,
            error: getDeleteError(
                row?.status ?? ""
            )
        }
    }

    if (storagePaths.length === 0) {
        return {
            success: true,
            storageCleaned: true
        }
    }

    const { error: storageError } =
        await supabaseAdmin.storage
            .from("geo-chat-media")
            .remove(storagePaths)

    if (storageError) {
        console.error(
            "GEO CHAT MESSAGE STORAGE CLEANUP ERROR:",
            {
                messageId,
                storagePaths,
                error: storageError
            }
        )

        return {
            success: true,
            storageCleaned: false
        }
    }

    return {
        success: true,
        storageCleaned: true
    }
}