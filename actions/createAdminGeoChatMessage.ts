"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type {
    GeoChatMessageAttachment,
    GeoChatPendingAttachment
} from "@/types/geoChatAttachments"

type MessageRow = {
    status: string
    id: string | null
    chat_id: string | null
    user_id: string | null
    content: string | null
    reply_to_id: string | null
    sender_role: string | null
    created_at: string | null
    updated_at: string | null
}

type AttachmentRow = {
    id: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number | string
}

type Result =
    | {
        success: true
        message: {
            id: string
            chat_id: string
            user_id: string
            content: string
            reply_to_id: string | null
            sender_role: string
            created_at: string
            updated_at: string
        }
        attachments:
            GeoChatMessageAttachment[]
    }
    | {
        success: false
        error: string
    }

function getErrorMessage(
    status: string
) {
    if (
        status === "unauthorized"
    ) {
        return "Необходимо войти в аккаунт"
    }

    if (status === "empty") {
        return "Введите сообщение или прикрепите изображение"
    }

    if (status === "too_long") {
        return "Сообщение слишком длинное"
    }

    if (
        status ===
        "chat_not_found"
    ) {
        return "Геочат не найден"
    }

    if (
        status ===
        "reply_not_found"
    ) {
        return "Сообщение для ответа не найдено"
    }

    if (
        status ===
        "too_many_attachments"
    ) {
        return "Можно прикрепить не более 5 изображений"
    }

    if (
        status ===
        "invalid_image"
    ) {
        return "В геочат можно прикреплять только изображения"
    }

    if (
        status ===
        "invalid_attachments"
    ) {
        return "Некорректные изображения"
    }

    if (
        status ===
        "attachment_not_found"
    ) {
        return "Одно из загруженных изображений не найдено"
    }

    return "Не удалось отправить сообщение"
}

function isValidAttachment(
    attachment:
        GeoChatPendingAttachment
) {
    return (
        typeof attachment.storagePath ===
            "string" &&
        attachment.storagePath
            .trim()
            .length > 0 &&
        typeof attachment.fileName ===
            "string" &&
        attachment.fileName
            .trim()
            .length > 0 &&
        attachment.fileName.length <=
            255 &&
        typeof attachment.mimeType ===
            "string" &&
        [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ].includes(
            attachment.mimeType
        ) &&
        Number.isSafeInteger(
            attachment.sizeBytes
        ) &&
        attachment.sizeBytes > 0 &&
        attachment.sizeBytes <=
            10 * 1024 * 1024
    )
}

async function loadSignedAttachments(
    messageId: string
): Promise<
    GeoChatMessageAttachment[]
> {
    const {
        data,
        error
    } = await supabaseAdmin
        .from(
            "geo_chat_message_attachments"
        )
        .select(
            "id,storage_path,file_name,mime_type,size_bytes"
        )
        .eq(
            "message_id",
            messageId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )

    if (error) {
        console.error(
            "ADMIN GEO CHAT ATTACHMENTS LOAD ERROR:",
            error
        )

        return []
    }

    const rows =
        (data ??
            []) as AttachmentRow[]

    return Promise.all(
        rows.map(
            async (row) => {
                const {
                    data:
                        signedData,
                    error:
                        signedError
                } =
                    await supabaseAdmin
                        .storage
                        .from(
                            "geo-chat-media"
                        )
                        .createSignedUrl(
                            row.storage_path,
                            60 * 60 *
                                12
                        )

                if (
                    signedError
                ) {
                    console.error(
                        "ADMIN GEO CHAT ATTACHMENT SIGN ERROR:",
                        signedError
                    )
                }

                return {
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
            }
        )
    )
}

export async function createAdminGeoChatMessage(
    chatId: string,
    content: string,
    replyToId:
        string | null = null,
    attachments:
        GeoChatPendingAttachment[] = []
): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    if (
        replyToId !== null &&
        !isUuid(replyToId)
    ) {
        return {
            success: false,
            error: "Некорректное сообщение для ответа"
        }
    }

    const normalizedContent =
        typeof content ===
        "string"
            ? content.trim()
            : ""

    if (
        !normalizedContent &&
        attachments.length === 0
    ) {
        return {
            success: false,
            error: "Введите сообщение или прикрепите изображение"
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

    if (
        attachments.length > 5
    ) {
        return {
            success: false,
            error: "Можно прикрепить не более 5 изображений"
        }
    }

    if (
        attachments.some(
            (attachment) =>
                !isValidAttachment(
                    attachment
                )
        )
    ) {
        return {
            success: false,
            error: "Некорректные изображения"
        }
    }

    const adminMode =
        await hasGeoChatAdminMode()

    if (!adminMode) {
        return {
            success: false,
            error: "Режим администратора не активен"
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
    } =
        await supabaseAdmin.rpc(
            "create_admin_geo_chat_message",
            {
                p_chat_id:
                    chatId,
                p_user_id:
                    user.id,
                p_content:
                    normalizedContent,
                p_reply_to_id:
                    replyToId,
                p_attachments:
                    attachments.map(
                        (
                            attachment
                        ) => ({
                            storage_path:
                                attachment.storagePath,
                            file_name:
                                attachment.fileName,
                            mime_type:
                                attachment.mimeType,
                            size_bytes:
                                attachment.sizeBytes
                        })
                    )
            }
        )

    if (error) {
        console.error(
            "ADMIN GEO CHAT MESSAGE CREATE ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось отправить сообщение"
        }
    }

    const rows =
        (data ??
            []) as MessageRow[]

    const row =
        rows[0]

    if (
        !row ||
        row.status !== "ok"
    ) {
        return {
            success: false,
            error:
                getErrorMessage(
                    row?.status ??
                        ""
                )
        }
    }

    if (
        !row.id ||
        !row.chat_id ||
        !row.user_id ||
        row.content === null ||
        !row.sender_role ||
        !row.created_at ||
        !row.updated_at
    ) {
        return {
            success: false,
            error: "Не удалось получить созданное сообщение"
        }
    }

    const signedAttachments =
        await loadSignedAttachments(
            row.id
        )

    return {
        success: true,
        message: {
            id:
                row.id,
            chat_id:
                row.chat_id,
            user_id:
                row.user_id,
            content:
                row.content,
            reply_to_id:
                row.reply_to_id,
            sender_role:
                row.sender_role,
            created_at:
                row.created_at,
            updated_at:
                row.updated_at
        },
        attachments:
            signedAttachments
    }
}