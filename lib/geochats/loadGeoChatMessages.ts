import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import type {
    GeoChatMessage,
    GeoChatSenderRole
} from "@/types/geoChat"
import type {
    GeoChatMessageAttachment,
    GeoChatMessageAttachmentMap
} from "@/types/geoChatAttachments"

type MessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    author_username: string
    author_display_name: string | null
    author_avatar_url: string | null
    reply_to_id: string | null
    reply_author_username: string | null
    reply_author_display_name: string | null
    reply_content: string | null
    sender_role: string | null
}

type AttachmentRow = {
    id: string
    message_id: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number | string
    created_at: string
}

type Result = {
    messages: GeoChatMessage[]
    initialAttachments:
    GeoChatMessageAttachmentMap
}

const INITIAL_IMAGE_MESSAGE_LIMIT = 3

const SIGNED_URL_TTL_SECONDS =
    60 * 60 * 6

function normalizeSenderRole(
    value: string | null
): GeoChatSenderRole | null {
    if (value === "admin") {
        return "admin"
    }

    if (value === "moderator") {
        return "moderator"
    }

    return null
}

export async function loadGeoChatMessages(
    chatId: string
): Promise<Result> {
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

        throw new Error(
            "Не удалось загрузить сообщения"
        )
    }

    const rows =
        (data ?? []) as MessageRow[]

    if (rows.length === 0) {
        return {
            messages: [],
            initialAttachments: {}
        }
    }

    const messageIds =
        rows.map(
            (message) =>
                message.id
        )

    const {
        data: attachmentData,
        error: attachmentError
    } = await supabaseAdmin
        .from(
            "geo_chat_message_attachments"
        )
        .select(
            "id,message_id,storage_path,file_name,mime_type,size_bytes,created_at"
        )
        .in(
            "message_id",
            messageIds
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        )

    if (attachmentError) {
        console.error(
            "GEO CHAT INITIAL ATTACHMENTS ERROR:",
            attachmentError
        )
    }

    const attachmentRows =
        attachmentError
            ? []
            : (
                attachmentData ??
                []
            ) as AttachmentRow[]

    const attachmentCounts =
        new Map<string, number>()

    for (
        const attachment of
        attachmentRows
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

    const messages:
        GeoChatMessage[] =
        rows.map((message) => ({
            id: message.id,
            chatId:
                message.chat_id,
            userId:
                message.user_id,
            content:
                message.content ?? "",
            createdAt:
                message.created_at,
            updatedAt:
                message.updated_at,
            authorUsername:
                message.author_username,
            authorDisplayName:
                message.author_display_name ??
                message.author_username,
            authorAvatarUrl:
                message.author_avatar_url,
            replyTo:
                message.reply_to_id
                    ? {
                        id:
                            message.reply_to_id,
                        authorUsername:
                            message.reply_author_username ??
                            "unknown",
                        authorDisplayName:
                            message.reply_author_display_name ??
                            message.reply_author_username ??
                            "Пользователь",
                        content:
                            message.reply_content ??
                            ""
                    }
                    : null,
            senderRole:
                normalizeSenderRole(
                    message.sender_role
                ),
            attachmentCount:
                attachmentCounts.get(
                    message.id
                ) ?? 0
        }))

    const initialMessageIds =
        new Set(
            [...rows]
                .filter(
                    (message) =>
                        (
                            attachmentCounts.get(
                                message.id
                            ) ?? 0
                        ) > 0
                )
                .sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            first.created_at
                        ).getTime() -
                        new Date(
                            second.created_at
                        ).getTime()
                )
                .slice(
                    -INITIAL_IMAGE_MESSAGE_LIMIT
                )
                .map(
                    (message) =>
                        message.id
                )
        )

    const rowsToSign =
        attachmentRows.filter(
            (attachment) =>
                initialMessageIds.has(
                    attachment.message_id
                )
        )

    const signedRows =
        await Promise.all(
            rowsToSign.map(
                async (
                    row
                ) => {
                    const {
                        data: signedData,
                        error: signedError
                    } =
                        await supabaseAdmin
                            .storage
                            .from(
                                "geo-chat-media"
                            )
                            .createSignedUrl(
                                row.storage_path,
                                SIGNED_URL_TTL_SECONDS
                            )

                    if (signedError) {
                        console.error(
                            "GEO CHAT INITIAL IMAGE SIGN ERROR:",
                            signedError
                        )
                    }

                    return {
                        row,
                        url:
                            signedData
                                ?.signedUrl ??
                            null
                    }
                }
            )
        )

    const initialAttachments:
        GeoChatMessageAttachmentMap =
        {}

    for (
        const {
            row,
            url
        } of signedRows
    ) {
        const attachment:
            GeoChatMessageAttachment =
        {
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
            url
        }

        if (
            !initialAttachments[
            row.message_id
            ]
        ) {
            initialAttachments[
                row.message_id
            ] = []
        }

        initialAttachments[
            row.message_id
        ].push(
            attachment
        )
    }

    return {
        messages,
        initialAttachments
    }
}