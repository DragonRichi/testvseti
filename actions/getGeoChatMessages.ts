"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type { GeoChatMessage } from "@/types/geoChat"

type MessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    author_username: string | null
    author_display_name: string | null
    author_avatar_url: string | null
    reply_to_id: string | null
    reply_author_username: string | null
    reply_author_display_name: string | null
    reply_content: string | null
    sender_role: string | null
}

type AttachmentRow = {
    message_id: string
}

type Result =
    | {
        success: true
        messages: GeoChatMessage[]
    }
    | {
        success: false
        error: string
    }

export async function getGeoChatMessages(
    chatId: string
): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
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
        data: canAccess,
        error: accessError
    } = await supabase.rpc(
        "can_access_geo_chat",
        {
            p_chat_id: chatId
        }
    )

    if (accessError) {
        console.error(
            "GEO CHAT ACCESS CHECK ERROR:",
            accessError
        )

        return {
            success: false,
            error: "Не удалось проверить доступ к геочату"
        }
    }

    if (!canAccess) {
        return {
            success: false,
            error: "Вы находитесь вне зоны этого геочата"
        }
    }

    const {
        data,
        error
    } = await supabaseAdmin.rpc(
        "get_geo_chat_messages",
        {
            p_chat_id: chatId,
            p_limit: 100
        }
    )

    if (error) {
        console.error(
            "GEO CHAT MESSAGES LOAD ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось загрузить сообщения"
        }
    }

    const rows =
        (data ?? []) as MessageRow[]

    if (rows.length === 0) {
        return {
            success: true,
            messages: []
        }
    }

    const messageIds =
        rows.map(
            (row) => row.id
        )

    const {
        data: attachmentRows,
        error: attachmentError
    } = await supabaseAdmin
        .from(
            "geo_chat_message_attachments"
        )
        .select("message_id")
        .in(
            "message_id",
            messageIds
        )

    if (attachmentError) {
        console.error(
            "GEO CHAT ATTACHMENT COUNT ERROR:",
            attachmentError
        )
    }

    const attachmentCounts =
        new Map<string, number>()

    for (
        const attachment of
        (attachmentRows ?? []) as AttachmentRow[]
    ) {
        attachmentCounts.set(
            attachment.message_id,
            (
                attachmentCounts.get(
                    attachment.message_id
                ) ?? 0
            ) + 1
        )
    }

    const messages =
        rows.map(
            (row): GeoChatMessage => {
                const senderRole:
                    GeoChatMessage["senderRole"] =
                    row.sender_role ===
                    "admin"
                        ? "admin"
                        : null

                return {
                    id: row.id,
                    chatId: row.chat_id,
                    userId: row.user_id,
                    content:
                        row.content ?? "",
                    createdAt:
                        row.created_at,
                    updatedAt:
                        row.updated_at,
                    authorUsername:
                        row.author_username ??
                        "unknown",
                    authorDisplayName:
                        row.author_display_name ??
                        row.author_username ??
                        "Пользователь",
                    authorAvatarUrl:
                        row.author_avatar_url,
                    replyTo:
                        row.reply_to_id
                            ? {
                                id:
                                    row.reply_to_id,
                                authorUsername:
                                    row.reply_author_username ??
                                    "unknown",
                                authorDisplayName:
                                    row.reply_author_display_name ??
                                    row.reply_author_username ??
                                    "Пользователь",
                                content:
                                    row.reply_content ??
                                    ""
                            }
                            : null,
                    senderRole,
                    attachmentCount:
                        attachmentCounts.get(
                            row.id
                        ) ?? 0
                }
            }
        )

    return {
        success: true,
        messages
    }
}