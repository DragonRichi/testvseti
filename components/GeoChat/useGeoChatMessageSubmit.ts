"use client"

import { createAdminGeoChatMessage } from "@/actions/createAdminGeoChatMessage"
import { createGeoChatMessage } from "@/actions/createGeoChatMessage"
import { updateGeoChatMessage } from "@/actions/updateGeoChatMessage"
import {
    removeGeoChatMedia,
    uploadGeoChatMedia
} from "@/lib/geochats/uploadGeoChatMedia"
import type {
    GeoChatMessage,
    GeoChatRoom
} from "@/types/geoChat"
import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"
import type { Profile } from "@/types/social"
import type {
    Dispatch,
    SetStateAction
} from "react"
import {
    useCallback,
    useRef,
    useState
} from "react"

type Options = {
    room: GeoChatRoom
    currentProfile: Profile
    setMessages:
        Dispatch<
            SetStateAction<
                GeoChatMessage[]
            >
        >
    setMessageAttachments: (
        messageId: string,
        attachments:
            GeoChatMessageAttachment[]
    ) => void
    canSend: boolean
    isAdminMode: boolean
    scrollToBottom: (
        behavior?: ScrollBehavior
    ) => void
    content: string
    setContent:
        Dispatch<
            SetStateAction<string>
        >
    setError:
        Dispatch<
            SetStateAction<string>
        >
    replyingTo:
        GeoChatMessage | null
    setReplyingTo:
        Dispatch<
            SetStateAction<
                GeoChatMessage | null
            >
        >
    editingMessage:
        GeoChatMessage | null
    setEditingMessage:
        Dispatch<
            SetStateAction<
                GeoChatMessage | null
            >
        >
    resetTextareaHeight: () => void
    cancelEdit: () => void
}

type CreatedMessage = {
    id: string
    chat_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
}

function useGeoChatMessageSubmit({
    room,
    currentProfile,
    setMessages,
    setMessageAttachments,
    canSend,
    isAdminMode,
    scrollToBottom,
    content,
    setContent,
    setError,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    resetTextareaHeight,
    cancelEdit
}: Options) {
    const [
        isPending,
        setIsPending
    ] = useState(false)

    const submitLockRef =
        useRef(false)

    const addCreatedMessage =
        useCallback(
            (
                resultMessage:
                    CreatedMessage,
                senderRole:
                    GeoChatMessage["senderRole"],
                createdAttachments:
                    GeoChatMessageAttachment[]
            ) => {
                const newMessage:
                    GeoChatMessage = {
                    id:
                        resultMessage.id,
                    chatId:
                        resultMessage.chat_id,
                    userId:
                        resultMessage.user_id,
                    content:
                        resultMessage.content,
                    createdAt:
                        resultMessage.created_at,
                    updatedAt:
                        resultMessage.updated_at,
                    authorUsername:
                        currentProfile.username,
                    authorDisplayName:
                        currentProfile.display_name,
                    authorAvatarUrl:
                        currentProfile.avatar_url,
                    replyTo:
                        replyingTo
                            ? {
                                id:
                                    replyingTo.id,
                                authorUsername:
                                    replyingTo.authorUsername,
                                authorDisplayName:
                                    replyingTo.authorDisplayName,
                                content:
                                    replyingTo.content
                            }
                            : null,
                    senderRole,
                    attachmentCount:
                        createdAttachments.length
                }

                setMessageAttachments(
                    newMessage.id,
                    createdAttachments
                )

                setMessages(
                    (
                        currentMessages
                    ) => {
                        if (
                            currentMessages.some(
                                (
                                    message
                                ) =>
                                    message.id ===
                                    newMessage.id
                            )
                        ) {
                            return currentMessages
                        }

                        return [
                            ...currentMessages,
                            newMessage
                        ]
                    }
                )

                setContent("")
                setReplyingTo(null)
                resetTextareaHeight()
                scrollToBottom()
            },
            [
                currentProfile,
                replyingTo,
                resetTextareaHeight,
                scrollToBottom,
                setContent,
                setMessageAttachments,
                setMessages,
                setReplyingTo
            ]
        )

    const updateEditedMessage =
        useCallback(
            (
                messageId: string,
                nextContent: string,
                updatedAt: string
            ) => {
                setMessages(
                    (
                        currentMessages
                    ) =>
                        currentMessages.map(
                            (
                                message
                            ) => {
                                let nextMessage =
                                    message

                                if (
                                    message.id ===
                                    messageId
                                ) {
                                    nextMessage =
                                        {
                                            ...nextMessage,
                                            content:
                                                nextContent,
                                            updatedAt
                                        }
                                }

                                if (
                                    nextMessage
                                        .replyTo
                                        ?.id ===
                                    messageId
                                ) {
                                    nextMessage =
                                        {
                                            ...nextMessage,
                                            replyTo:
                                                {
                                                    ...nextMessage.replyTo,
                                                    content:
                                                        nextContent
                                                }
                                        }
                                }

                                return nextMessage
                            }
                        )
                )
            },
            [setMessages]
        )

    const handleSubmit = async (
        files: File[] = []
    ): Promise<boolean> => {
        if (
            submitLockRef.current
        ) {
            return false
        }

        if (!canSend) {
            setError(
                "Вы находитесь вне зоны этого геочата"
            )

            return false
        }

        const normalizedContent =
            content.trim()

        if (editingMessage) {
            if (!normalizedContent) {
                return false
            }
        } else if (
            !normalizedContent &&
            files.length === 0
        ) {
            return false
        }

        submitLockRef.current =
            true

        setIsPending(true)
        setError("")

        let uploadedPaths:
            string[] = []

        try {
            if (editingMessage) {
                if (
                    normalizedContent ===
                    editingMessage.content.trim()
                ) {
                    cancelEdit()
                    return true
                }

                const result =
                    await updateGeoChatMessage(
                        room.id,
                        editingMessage.id,
                        normalizedContent
                    )

                if (
                    result.success ===
                    false
                ) {
                    setError(
                        result.error
                    )

                    return false
                }

                updateEditedMessage(
                    editingMessage.id,
                    result.message
                        .content,
                    result.message
                        .updated_at
                )

                setEditingMessage(
                    null
                )

                setContent("")
                resetTextareaHeight()

                return true
            }

            const uploadedAttachments =
                files.length > 0
                    ? await uploadGeoChatMedia(
                        files,
                        currentProfile.id,
                        room.id
                    )
                    : []

            uploadedPaths =
                uploadedAttachments.map(
                    (
                        attachment
                    ) =>
                        attachment.storagePath
                )

            const result =
                isAdminMode
                    ? await createAdminGeoChatMessage(
                        room.id,
                        normalizedContent,
                        replyingTo?.id ??
                            null,
                        uploadedAttachments
                    )
                    : await createGeoChatMessage(
                        room.id,
                        normalizedContent,
                        replyingTo?.id ??
                            null,
                        uploadedAttachments
                    )

            if (
                result.success ===
                false
            ) {
                if (
                    uploadedPaths.length >
                    0
                ) {
                    await removeGeoChatMedia(
                        uploadedPaths
                    )

                    uploadedPaths = []
                }

                setError(
                    result.error
                )

                return false
            }

            addCreatedMessage(
                result.message,
                isAdminMode
                    ? "admin"
                    : null,
                result.attachments
            )

            return true
        } catch (error) {
            console.error(
                "GEO CHAT MESSAGE SUBMIT ERROR:",
                error
            )

            if (
                uploadedPaths.length >
                0
            ) {
                await removeGeoChatMedia(
                    uploadedPaths
                )
            }

            setError(
                error instanceof Error
                    ? error.message
                    : editingMessage
                      ? "Не удалось изменить сообщение"
                      : "Не удалось отправить сообщение"
            )

            return false
        } finally {
            submitLockRef.current =
                false

            setIsPending(false)
        }
    }

    return {
        isPending,
        handleSubmit
    }
}

export default useGeoChatMessageSubmit