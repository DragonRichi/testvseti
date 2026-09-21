"use client"

import { createAdminGeoChatMessage } from "@/actions/createAdminGeoChatMessage"
import { createGeoChatMessage } from "@/actions/createGeoChatMessage"
import { deleteGeoChatMessage } from "@/actions/deleteGeoChatMessage"
import { updateGeoChatMessage } from "@/actions/updateGeoChatMessage"
import {
    removeGeoChatMedia,
    uploadGeoChatMedia
} from "@/lib/geochats/uploadGeoChatMedia"
import type { GeoChatMessage, GeoChatRoom } from "@/types/geoChat"
import type { Profile } from "@/types/social"
import type { Dispatch, SetStateAction } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

type Options = {
    room: GeoChatRoom
    currentProfile: Profile
    messages: GeoChatMessage[]
    setMessages: Dispatch<SetStateAction<GeoChatMessage[]>>
    canSend: boolean
    isAdminMode: boolean
    scrollToBottom: (behavior?: ScrollBehavior) => void
}

function useGeoChatMessageActions({
    room,
    currentProfile,
    messages,
    setMessages,
    canSend,
    isAdminMode,
    scrollToBottom
}: Options) {
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [replyingTo, setReplyingTo] = useState<GeoChatMessage | null>(null)
    const [editingMessage, setEditingMessage] = useState<GeoChatMessage | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<GeoChatMessage | null>(null)

    const submitLockRef = useRef(false)
    const deleteLockRef = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const resetTextareaHeight = useCallback(() => {
        if (!textareaRef.current) return

        textareaRef.current.style.height = "38px"
        textareaRef.current.style.overflowY = "hidden"
    }, [])

    const resizeTextarea = useCallback(() => {
        requestAnimationFrame(() => {
            const textarea = textareaRef.current

            if (!textarea) return

            textarea.style.height = "38px"

            const nextHeight = Math.min(
                textarea.scrollHeight,
                100
            )

            textarea.style.height = `${nextHeight}px`
            textarea.style.overflowY =
                textarea.scrollHeight > 100
                    ? "auto"
                    : "hidden"
        })
    }, [])

    const focusComposer = useCallback(() => {
        requestAnimationFrame(() => {
            textareaRef.current?.focus()

            textareaRef.current?.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            )
        })
    }, [])

    useEffect(() => {
        const messageIds = new Set(
            messages.map((message) => message.id)
        )

        if (
            replyingTo &&
            !messageIds.has(replyingTo.id)
        ) {
            setReplyingTo(null)
        }

        if (
            editingMessage &&
            !messageIds.has(editingMessage.id)
        ) {
            setEditingMessage(null)
            setContent("")
            resetTextareaHeight()
        }

        if (
            deleteTarget &&
            !messageIds.has(deleteTarget.id)
        ) {
            setDeleteTarget(null)
        }
    }, [
        deleteTarget,
        editingMessage,
        messages,
        replyingTo,
        resetTextareaHeight
    ])

    const handleReplyToMessage = (
        message: GeoChatMessage
    ) => {
        if (!canSend) return

        setEditingMessage(null)
        setReplyingTo(message)
        setContent("")
        setError("")
        resetTextareaHeight()
        focusComposer()
    }

    const handleEditMessage = (
        message: GeoChatMessage
    ) => {
        if (!canSend) return
        if (
            message.userId !==
            currentProfile.id
        ) {
            return
        }

        setReplyingTo(null)
        setEditingMessage(message)
        setContent(message.content)
        setError("")
        resizeTextarea()
        focusComposer()
    }

    const cancelEdit = () => {
        setEditingMessage(null)
        setContent("")
        setError("")
        resetTextareaHeight()
    }

    const handleDeleteRequest = (
        message: GeoChatMessage
    ) => {
        if (
            message.userId !==
            currentProfile.id
        ) {
            return
        }

        setDeleteTarget(message)
    }

    const handleDeleteConfirm =
        async () => {
            if (!deleteTarget) return
            if (deleteLockRef.current) return

            deleteLockRef.current = true
            setIsDeleting(true)
            setError("")

            const messageId =
                deleteTarget.id

            try {
                const result =
                    await deleteGeoChatMessage(
                        room.id,
                        messageId
                    )

                if (
                    result.success ===
                    false
                ) {
                    setError(result.error)
                    return
                }

                setMessages(
                    (currentMessages) =>
                        currentMessages
                            .filter(
                                (message) =>
                                    message.id !==
                                    messageId
                            )
                            .map(
                                (message) => {
                                    if (
                                        message.replyTo
                                            ?.id !==
                                        messageId
                                    ) {
                                        return message
                                    }

                                    return {
                                        ...message,
                                        replyTo: null
                                    }
                                }
                            )
                )

                if (
                    replyingTo?.id ===
                    messageId
                ) {
                    setReplyingTo(null)
                }

                if (
                    editingMessage?.id ===
                    messageId
                ) {
                    setEditingMessage(
                        null
                    )
                    setContent("")
                    resetTextareaHeight()
                }

                setDeleteTarget(null)
            } catch (error) {
                console.error(
                    "GEO CHAT MESSAGE DELETE ERROR:",
                    error
                )

                setError(
                    "Не удалось удалить сообщение"
                )
            } finally {
                deleteLockRef.current =
                    false
                setIsDeleting(false)
            }
        }

    const handleSubmit = async (
        files: File[] = []
    ): Promise<boolean> => {
        if (submitLockRef.current) {
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

        if (
            isAdminMode &&
            files.length > 0
        ) {
            setError(
                "Отправка изображений в режиме администратора пока недоступна"
            )

            return false
        }

        submitLockRef.current = true
        setIsPending(true)
        setError("")

        let uploadedPaths: string[] = []

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
                    setError(result.error)
                    return false
                }

                setMessages(
                    (currentMessages) =>
                        currentMessages.map(
                            (message) => {
                                let nextMessage =
                                    message

                                if (
                                    message.id ===
                                    editingMessage.id
                                ) {
                                    nextMessage = {
                                        ...nextMessage,
                                        content:
                                            result
                                                .message
                                                .content,
                                        updatedAt:
                                            result
                                                .message
                                                .updated_at
                                    }
                                }

                                if (
                                    nextMessage
                                        .replyTo
                                        ?.id ===
                                    editingMessage.id
                                ) {
                                    nextMessage = {
                                        ...nextMessage,
                                        replyTo: {
                                            ...nextMessage.replyTo,
                                            content:
                                                result
                                                    .message
                                                    .content
                                        }
                                    }
                                }

                                return nextMessage
                            }
                        )
                )

                setEditingMessage(null)
                setContent("")
                resetTextareaHeight()

                return true
            }

            if (isAdminMode) {
                const result =
                    await createAdminGeoChatMessage(
                        room.id,
                        normalizedContent,
                        replyingTo?.id ??
                        null
                    )

                if (
                    result.success ===
                    false
                ) {
                    setError(result.error)
                    return false
                }

                const newMessage:
                    GeoChatMessage = {
                    id: result.message.id,
                    chatId:
                        result.message
                            .chat_id,
                    userId:
                        result.message
                            .user_id,
                    content:
                        result.message
                            .content,
                    createdAt:
                        result.message
                            .created_at,
                    updatedAt:
                        result.message
                            .updated_at,
                    authorUsername:
                        currentProfile.username,
                    authorDisplayName:
                        currentProfile.display_name,
                    authorAvatarUrl:
                        currentProfile.avatar_url,
                    replyTo: replyingTo
                        ? {
                            id: replyingTo.id,
                            authorUsername:
                                replyingTo.authorUsername,
                            authorDisplayName:
                                replyingTo.authorDisplayName,
                            content:
                                replyingTo.content
                        }
                        : null,
                    senderRole: "admin"
                }

                setMessages(
                    (currentMessages) => {
                        if (
                            currentMessages.some(
                                (message) =>
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
                    (attachment) =>
                        attachment.storagePath
                )

            const result =
                await createGeoChatMessage(
                    room.id,
                    normalizedContent,
                    replyingTo?.id ??
                    null,
                    uploadedAttachments
                )

            if (
                result.success === false
            ) {
                if (
                    uploadedPaths.length >
                    0
                ) {
                    await removeGeoChatMedia(
                        uploadedPaths
                    )
                }

                setError(result.error)

                return false
            }

            const newMessage:
                GeoChatMessage = {
                id: result.message.id,
                chatId:
                    result.message.chat_id,
                userId:
                    result.message.user_id,
                content:
                    result.message.content,
                createdAt:
                    result.message.created_at,
                updatedAt:
                    result.message.updated_at,
                authorUsername:
                    currentProfile.username,
                authorDisplayName:
                    currentProfile.display_name,
                authorAvatarUrl:
                    currentProfile.avatar_url,
                replyTo: replyingTo
                    ? {
                        id: replyingTo.id,
                        authorUsername:
                            replyingTo.authorUsername,
                        authorDisplayName:
                            replyingTo.authorDisplayName,
                        content:
                            replyingTo.content
                    }
                    : null,
                senderRole: null
            }

            setMessages(
                (currentMessages) => {
                    if (
                        currentMessages.some(
                            (message) =>
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

            return true
        } catch (error) {
            console.error(
                "GEO CHAT MESSAGE SUBMIT ERROR:",
                error
            )

            if (
                uploadedPaths.length > 0
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
            submitLockRef.current = false
            setIsPending(false)
        }
    }

    return {
        content,
        setContent,
        error,
        setError,
        isPending,
        isDeleting,
        replyingTo,
        setReplyingTo,
        editingMessage,
        deleteTarget,
        setDeleteTarget,
        textareaRef,
        handleReplyToMessage,
        handleEditMessage,
        cancelEdit,
        handleDeleteRequest,
        handleDeleteConfirm,
        handleSubmit
    }
}

export default useGeoChatMessageActions