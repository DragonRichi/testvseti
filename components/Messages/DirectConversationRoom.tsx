"use client"

import { createDirectMessage } from "@/actions/createDirectMessage"
import type { DirectConversation, DirectMessage } from "@/types/directMessages"
import type { Profile } from "@/types/social"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import UserAvatar from "../ui/UserAvatar"
import DirectMessageComposer from "./DirectMessageComposer"
import DirectMessageItem from "./DirectMessageItem"
import useDirectBottomPin from "./useDirectBottomPin"
import useDirectComposerFocus from "./useDirectComposerFocus"
import useDirectMessageRealtime from "./useDirectMessageRealtime"
import useDirectOlderMessages from "./useDirectOlderMessages"
import useDirectVisualViewport from "./useDirectVisualViewport"

type Props = {
    conversation: DirectConversation
    initialMessages: DirectMessage[]
    initialHasMore: boolean
    currentProfile: Profile
}

function DirectConversationRoom({
    conversation,
    initialMessages,
    initialHasMore,
    currentProfile
}: Props) {
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)

    const sendLockRef = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const endRef = useRef<HTMLDivElement>(null)

    const {
        handleFocus: handleComposerFocus,
        handleBlur: handleComposerBlur
    } = useDirectComposerFocus({
        containerRef
    })

    const mobileStyle = useDirectVisualViewport()

    const {
        messages,
        setMessages
    } = useDirectMessageRealtime({
        conversationId: conversation.id,
        initialMessages
    })

    const handleError = useCallback(
        (message: string) => {
            setError(message)
        },
        []
    )

    const {
        isLoadingOlder
    } = useDirectOlderMessages({
        conversationId: conversation.id,
        messages,
        setMessages,
        initialHasMore,
        containerRef,
        onError: handleError
    })

    useDirectBottomPin({
        conversationId: conversation.id,
        messageCount: messages.length,
        containerRef,
        endRef
    })

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow
        const previousHtmlOverflow = document.documentElement.style.overflow

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousBodyOverflow
            document.documentElement.style.overflow = previousHtmlOverflow
        }
    }, [])

    const resetTextarea = () => {
        const textarea = textareaRef.current

        if (!textarea) return

        textarea.style.height = "38px"
        textarea.style.overflowY = "hidden"
    }

    const handleSubmit = async () => {
        const normalized = content.trim()

        if (!normalized || sendLockRef.current) {
            return
        }

        sendLockRef.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createDirectMessage(
                conversation.id,
                normalized
            )

            if (result.success === false) {
                setError(result.error)
                return
            }

            const newMessage: DirectMessage = {
                id: result.message.id,
                conversationId: result.message.conversation_id,
                userId: result.message.user_id,
                content: result.message.content,
                replyToId: result.message.reply_to_id,
                forwardedFromMessageId: null,
                isEdited: false,
                editedAt: null,
                deliveredAt: null,
                createdAt: result.message.created_at,
                authorUsername: currentProfile.username,
                authorDisplayName: currentProfile.display_name,
                authorAvatarUrl: currentProfile.avatar_url,
                replyTo: null
            }

            setMessages((current) =>
                current.some(
                    (message) =>
                        message.id === newMessage.id
                )
                    ? current
                    : [
                        ...current,
                        newMessage
                    ]
            )

            setContent("")
            resetTextarea()
        } catch (error) {
            console.error(
                "DIRECT MESSAGE SUBMIT ERROR:",
                error
            )

            setError(
                "Не удалось отправить сообщение"
            )
        } finally {
            sendLockRef.current = false
            setIsPending(false)
        }
    }

    return (
        <div
            style={mobileStyle}
            className="fixed inset-x-0 top-0 z-50 flex h-dvh flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-[calc(100dvh-32px)] lg:min-h-[520] lg:rounded-3xl lg:border lg:border-green-100"
        >
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-3 sm:h-16 sm:px-5">
                <Link
                    href="/messages"
                    aria-label="Назад к сообщениям"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    <ArrowLeft className="size-5" />
                </Link>

                <Link
                    href={`/profile/${conversation.username}`}
                    className="shrink-0 rounded-full"
                >
                    <UserAvatar
                        userId={conversation.otherUserId}
                        displayName={conversation.displayName}
                        avatarUrl={conversation.avatarUrl}
                        size={40}
                        priority
                    />
                </Link>

                <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold text-gray-900 sm:text-base">
                        {conversation.displayName}
                    </div>

                    <div className="truncate text-[11px] text-main-gray sm:text-xs">
                        @{conversation.username}
                    </div>
                </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
                {isLoadingOlder && (
                    <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
                        <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-white/95 px-3 py-1.5 text-xs text-main-gray shadow-sm">
                            <LoaderCircle className="size-3.5 animate-spin text-main-green" />
                            Загружаем сообщения
                        </div>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="h-full overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
                >
                    {messages.length === 0 ? (
                        <div className="flex min-h-full items-center justify-center px-6 text-center">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    Начните переписку
                                </div>

                                <div className="mt-1 text-sm leading-6 text-main-gray">
                                    Первое сообщение появится здесь.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {messages.map((message) => (
                                <DirectMessageItem
                                    key={message.id}
                                    message={message}
                                    currentProfileId={currentProfile.id}
                                />
                            ))}

                            <div
                                ref={endRef}
                                className="h-px"
                            />
                        </div>
                    )}

                    {messages.length === 0 && (
                        <div
                            ref={endRef}
                            className="h-px"
                        />
                    )}
                </div>
            </div>

            {error && (
                <div className="shrink-0 bg-red-50 px-4 py-2 text-xs text-red-600">
                    {error}
                </div>
            )}

            <DirectMessageComposer
                content={content}
                isPending={isPending}
                textareaRef={textareaRef}
                onContentChange={(value) => {
                    setContent(value)
                    setError("")
                }}
                onFocus={handleComposerFocus}
                onBlur={handleComposerBlur}
                onSubmit={() =>
                    void handleSubmit()
                }
            />
        </div>
    )
}

export default DirectConversationRoom
