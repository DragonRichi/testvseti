"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"

type AttachmentRow = {
    id: string
    message_id: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number | string
}

type Result =
    | {
        success: true
        attachments: Record<string, GeoChatMessageAttachment[]>
    }
    | {
        success: false
        error: string
    }

const MAX_MESSAGE_IDS = 200
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6

export async function getGeoChatMessageAttachments(
    chatId: string,
    messageIds: string[]
): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    const normalizedIds = [
        ...new Set(
            messageIds.filter(
                (messageId) =>
                    typeof messageId === "string" &&
                    isUuid(messageId)
            )
        )
    ]

    if (normalizedIds.length === 0) {
        return {
            success: true,
            attachments: {}
        }
    }

    if (normalizedIds.length > MAX_MESSAGE_IDS) {
        return {
            success: false,
            error: "Слишком много сообщений"
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
            "GEO CHAT ATTACHMENTS ACCESS ERROR:",
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
            error: "Нет доступа к геочату"
        }
    }

    const {
        data: messageRows,
        error: messagesError
    } = await supabaseAdmin
        .from("geo_chat_messages")
        .select("id")
        .eq("chat_id", chatId)
        .in("id", normalizedIds)

    if (messagesError) {
        console.error(
            "GEO CHAT ATTACHMENT MESSAGES LOAD ERROR:",
            messagesError
        )

        return {
            success: false,
            error: "Не удалось загрузить изображения"
        }
    }

    const allowedMessageIds = (
        messageRows ?? []
    ).map((message) => message.id)

    if (allowedMessageIds.length === 0) {
        return {
            success: true,
            attachments: {}
        }
    }

    const {
        data,
        error
    } = await supabaseAdmin
        .from("geo_chat_message_attachments")
        .select(
            "id,message_id,storage_path,file_name,mime_type,size_bytes"
        )
        .in(
            "message_id",
            allowedMessageIds
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )

    if (error) {
        console.error(
            "GEO CHAT ATTACHMENTS LOAD ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось загрузить изображения"
        }
    }

    const rows =
        (data ?? []) as AttachmentRow[]

    const attachments: Record<
        string,
        GeoChatMessageAttachment[]
    > = {}

    await Promise.all(
        rows.map(async (row) => {
            const {
                data: signedData,
                error: signedError
            } =
                await supabaseAdmin.storage
                    .from("geo-chat-media")
                    .createSignedUrl(
                        row.storage_path,
                        SIGNED_URL_TTL_SECONDS
                    )

            if (signedError) {
                console.error(
                    "GEO CHAT IMAGE SIGN ERROR:",
                    signedError
                )
            }

            const attachment:
                GeoChatMessageAttachment = {
                    id: row.id,
                    storagePath:
                        row.storage_path,
                    fileName:
                        row.file_name,
                    mimeType:
                        row.mime_type,
                    sizeBytes:
                        Number(
                            row.size_bytes
                        ) || 0,
                    url:
                        signedData
                            ?.signedUrl ??
                        null
                }

            if (
                !attachments[
                    row.message_id
                ]
            ) {
                attachments[
                    row.message_id
                ] = []
            }

            attachments[
                row.message_id
            ].push(attachment)
        })
    )

    return {
        success: true,
        attachments
    }
}