"use server"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

type MessageRow = {
    id: string
    conversation_id: string
    user_id: string
    content: string
    reply_to_id: string | null
    created_at: string
}

type Result =
    | {
        success: true
        message: MessageRow
    }
    | {
        success: false
        error: string
    }

function getError(
    status: string | undefined
) {
    if (status === "empty") {
        return "Сообщение не может быть пустым"
    }

    if (status === "too_long") {
        return "Сообщение слишком длинное"
    }

    if (
        status ===
        "reply_not_found"
    ) {
        return "Сообщение, на которое вы отвечаете, не найдено"
    }

    if (status === "forbidden") {
        return "У вас нет доступа к этому диалогу"
    }

    if (
        status ===
        "unauthorized"
    ) {
        return "Необходимо войти в аккаунт"
    }

    return "Не удалось отправить сообщение"
}

export async function createDirectMessage(
    conversationId: string,
    content: string,
    replyToId: string | null = null
): Promise<Result> {
    if (
        !isUuid(conversationId) ||
        (
            replyToId &&
            !isUuid(replyToId)
        )
    ) {
        return {
            success: false,
            error: "Некорректный диалог"
        }
    }

    const normalizedContent =
        content.trim()

    if (!normalizedContent) {
        return {
            success: false,
            error: "Сообщение не может быть пустым"
        }
    }

    if (
        normalizedContent.length >
        4000
    ) {
        return {
            success: false,
            error: "Сообщение слишком длинное"
        }
    }

    const supabase =
        await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "create_direct_message_web_v1",
        {
            p_conversation_id:
                conversationId,
            p_content:
                normalizedContent,
            p_reply_to_id:
                replyToId
        }
    )

    if (error) {
        console.error(
            "CREATE DIRECT MESSAGE ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    const row = data?.[0]

    if (
        !row ||
        row.status !== "ok" ||
        !row.id
    ) {
        return {
            success: false,
            error:
                getError(row?.status)
        }
    }

    return {
        success: true,
        message: {
            id: row.id,
            conversation_id:
                row.conversation_id,
            user_id:
                row.user_id,
            content:
                row.content,
            reply_to_id:
                row.reply_to_id,
            created_at:
                row.created_at
        }
    }
}