"use client"

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
    useEffect,
    useRef,
    useState
} from "react"
import useGeoChatMessageDelete from "./useGeoChatMessageDelete"
import useGeoChatMessageSubmit from "./useGeoChatMessageSubmit"

type Options = {
    room: GeoChatRoom
    currentProfile: Profile
    messages: GeoChatMessage[]
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
}

function useGeoChatMessageActions({
    room,
    currentProfile,
    messages,
    setMessages,
    setMessageAttachments,
    canSend,
    isAdminMode,
    scrollToBottom
}: Options) {
    const [content, setContent] =
        useState("")

    const [error, setError] =
        useState("")

    const [
        replyingTo,
        setReplyingTo
    ] =
        useState<GeoChatMessage | null>(
            null
        )

    const [
        editingMessage,
        setEditingMessage
    ] =
        useState<GeoChatMessage | null>(
            null
        )

    const textareaRef =
        useRef<HTMLTextAreaElement>(
            null
        )

    const resetTextareaHeight =
        useCallback(() => {
            const textarea =
                textareaRef.current

            if (!textarea) return

            textarea.style.height =
                "38px"

            textarea.style.overflowY =
                "hidden"
        }, [])

    const resizeTextarea =
        useCallback(() => {
            requestAnimationFrame(
                () => {
                    const textarea =
                        textareaRef.current

                    if (!textarea) {
                        return
                    }

                    textarea.style.height =
                        "38px"

                    const nextHeight =
                        Math.min(
                            textarea.scrollHeight,
                            100
                        )

                    textarea.style.height =
                        `${nextHeight}px`

                    textarea.style.overflowY =
                        textarea.scrollHeight >
                        100
                            ? "auto"
                            : "hidden"
                }
            )
        }, [])

    const focusComposer =
        useCallback(() => {
            requestAnimationFrame(
                () => {
                    const textarea =
                        textareaRef.current

                    if (!textarea) {
                        return
                    }

                    textarea.focus()

                    textarea.setSelectionRange(
                        textarea.value
                            .length,
                        textarea.value
                            .length
                    )
                }
            )
        }, [])

    const cancelEdit =
        useCallback(() => {
            setEditingMessage(null)
            setContent("")
            setError("")
            resetTextareaHeight()
        }, [
            resetTextareaHeight
        ])

    useEffect(() => {
        const messageIds =
            new Set(
                messages.map(
                    (message) =>
                        message.id
                )
            )

        if (
            replyingTo &&
            !messageIds.has(
                replyingTo.id
            )
        ) {
            setReplyingTo(null)
        }

        if (
            editingMessage &&
            !messageIds.has(
                editingMessage.id
            )
        ) {
            setEditingMessage(null)
            setContent("")
            resetTextareaHeight()
        }
    }, [
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

    const {
        isPending,
        handleSubmit
    } = useGeoChatMessageSubmit({
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
    })

    const {
        isDeleting,
        deleteTarget,
        setDeleteTarget,
        handleDeleteRequest,
        handleDeleteConfirm
    } = useGeoChatMessageDelete({
        roomId: room.id,
        currentProfileId:
            currentProfile.id,
        messages,
        setMessages,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        setContent,
        setError,
        resetTextareaHeight
    })

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