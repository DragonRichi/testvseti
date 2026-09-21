"use client"

import { deleteGeoChatMessage } from "@/actions/deleteGeoChatMessage"
import type { GeoChatMessage } from "@/types/geoChat"
import type { Dispatch, SetStateAction } from "react"
import { useEffect, useRef, useState } from "react"

type Options = {
    roomId: string
    currentProfileId: string
    messages: GeoChatMessage[]
    setMessages: Dispatch<SetStateAction<GeoChatMessage[]>>
    replyingTo: GeoChatMessage | null
    setReplyingTo: Dispatch<SetStateAction<GeoChatMessage | null>>
    editingMessage: GeoChatMessage | null
    setEditingMessage: Dispatch<SetStateAction<GeoChatMessage | null>>
    setContent: Dispatch<SetStateAction<string>>
    setError: Dispatch<SetStateAction<string>>
    resetTextareaHeight: () => void
}

function useGeoChatMessageDelete({
    roomId,
    currentProfileId,
    messages,
    setMessages,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    setContent,
    setError,
    resetTextareaHeight
}: Options) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<GeoChatMessage | null>(null)
    const deleteLockRef = useRef(false)

    useEffect(() => {
        if (!deleteTarget) return

        const exists = messages.some(
            (message) =>
                message.id === deleteTarget.id
        )

        if (!exists) {
            setDeleteTarget(null)
        }
    }, [deleteTarget, messages])

    const handleDeleteRequest = (
        message: GeoChatMessage
    ) => {
        if (message.userId !== currentProfileId) return

        setDeleteTarget(message)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        if (deleteLockRef.current) return

        deleteLockRef.current = true
        setIsDeleting(true)
        setError("")

        const messageId = deleteTarget.id

        try {
            const result = await deleteGeoChatMessage(
                roomId,
                messageId
            )

            if (result.success === false) {
                setError(result.error)
                return
            }

            setMessages((currentMessages) =>
                currentMessages
                    .filter(
                        (message) =>
                            message.id !== messageId
                    )
                    .map((message) =>
                        message.replyTo?.id === messageId
                            ? {
                                ...message,
                                replyTo: null
                            }
                            : message
                    )
            )

            if (replyingTo?.id === messageId) {
                setReplyingTo(null)
            }

            if (editingMessage?.id === messageId) {
                setEditingMessage(null)
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
            deleteLockRef.current = false
            setIsDeleting(false)
        }
    }

    return {
        isDeleting,
        deleteTarget,
        setDeleteTarget,
        handleDeleteRequest,
        handleDeleteConfirm
    }
}

export default useGeoChatMessageDelete