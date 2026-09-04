"use client"

import { createGeoChatMessage } from "@/actions/createGeoChatMessage"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import type { Profile } from "@/types/social"
import { ArrowLeft, Hash, MoreHorizontal, Paperclip, Send, Smile } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { KeyboardEvent } from "react"
import { useEffect, useRef, useState } from "react"

type Props = {
    room: GeoChatRoomType
    initialMessages: GeoChatMessage[]
    currentProfile: Profile
}

function formatMessageDate(value: string) {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value))
}

function GeoChatRoom({ room, initialMessages, currentProfile }: Props) {
    const [messages, setMessages] = useState<GeoChatMessage[]>(initialMessages)
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)

    const submitLockRef = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow
        const previousHtmlOverflow = document.documentElement.style.overflow
        const previousBodyOverscroll = document.body.style.overscrollBehavior

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"
        document.body.style.overscrollBehavior = "none"

        return () => {
            document.body.style.overflow = previousBodyOverflow
            document.documentElement.style.overflow = previousHtmlOverflow
            document.body.style.overscrollBehavior = previousBodyOverscroll
        }
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "instant",
            block: "end"
        })
    }, [])

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end"
            })
        })
    }

    const handleSubmit = async () => {
        if (submitLockRef.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) return

        submitLockRef.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createGeoChatMessage(room.id, normalizedContent)

            if (result.success === false) {
                setError(result.error)
                return
            }

            const newMessage: GeoChatMessage = {
                id: result.message.id,
                chatId: result.message.chat_id,
                userId: result.message.user_id,
                content: result.message.content,
                createdAt: result.message.created_at,
                updatedAt: result.message.updated_at,
                authorUsername: currentProfile.username,
                authorDisplayName: currentProfile.display_name,
                authorAvatarUrl: currentProfile.avatar_url
            }

            setMessages((prev) => [...prev, newMessage])
            setContent("")

            if (textareaRef.current) {
                textareaRef.current.style.height = "38px"
                textareaRef.current.style.overflowY = "hidden"
            }

            scrollToBottom()
        } catch (error) {
            console.error("GEO CHAT MESSAGE CREATE ERROR:", error)
            setError("Не удалось отправить сообщение")
        } finally {
            submitLockRef.current = false
            setIsPending(false)
        }
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter") return
        if (event.shiftKey) return

        event.preventDefault()
        void handleSubmit()
    }

    return (
        <div className="fixed inset-x-0 bottom-0 top-[64] z-40 flex flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-[calc(100dvh-32px)] lg:min-h-[520] lg:rounded-3xl lg:border lg:border-green-100">
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 sm:h-16 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <Link href="/geochats" aria-label="Назад к геочатам" className="flex size-8 shrink-0 items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-9">
                        <ArrowLeft className="size-5" />
                    </Link>

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-main-green sm:size-10">
                        <Hash className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-gray-900 sm:text-lg">#{room.name}</div>
                        <div className="text-[11px] text-main-gray sm:text-xs">Радиус {Math.round(room.radiusM / 1000)} км</div>
                    </div>
                </div>

                <button type="button" aria-label="Меню геочата" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-10">
                    <MoreHorizontal className="size-5" />
                </button>
            </div>

            <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5">
                {messages.length === 0 ? (
                    <div className="flex h-full min-h-[220] items-center justify-center text-center">
                        <div className="max-w-[360]">
                            <div className="text-base font-semibold text-gray-900">Пока здесь тихо</div>
                            <div className="mt-2 text-sm leading-6 text-main-gray">Напишите первое сообщение в этом геочате.</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3.5 sm:gap-4">
                        {messages.map((message) => (
                            <div key={message.id} className="flex items-end gap-2">
                                <Link href={`/profile/${message.authorUsername}`} className="relative mb-5 size-8 shrink-0 overflow-hidden rounded-full bg-bg-green sm:size-9">
                                    <Image src={message.authorAvatarUrl ?? "/user-avatar.svg"} alt={message.authorDisplayName} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                                </Link>

                                <div className="min-w-0 max-w-[620] flex-1">
                                    <div className="rounded-[18px] bg-[#f2f3f2] px-3 py-2.5 sm:rounded-[20px] sm:px-4">
                                        <Link href={`/profile/${message.authorUsername}`} className="text-xs font-semibold text-main-green hover:underline sm:text-sm">
                                            {message.authorDisplayName}
                                        </Link>

                                        <div className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-900 sm:text-[15px] sm:leading-6">
                                            {message.content}
                                        </div>
                                    </div>

                                    <div className="mt-1 px-1 text-[10px] text-main-gray sm:text-xs">
                                        {formatMessageDate(message.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white px-2 py-2 sm:p-4">
                {error && (
                    <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex items-end gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 sm:gap-2 sm:p-2">
                    <button type="button" aria-label="Прикрепить файл" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 sm:size-9">
                        <Paperclip className="size-4 sm:size-5" />
                    </button>

                    <button type="button" aria-label="Эмодзи" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 sm:size-9">
                        <Smile className="size-4 sm:size-5" />
                    </button>

                    <textarea ref={textareaRef} value={content} onKeyDown={handleKeyDown} onFocus={scrollToBottom} onChange={(event) => { setContent(event.target.value); setError(""); event.currentTarget.style.height = "38px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 100); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 100 ? "auto" : "hidden" }} placeholder="Написать сообщение..." maxLength={4000} rows={1} className="min-h-[38] max-h-[100] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-1 py-2 text-sm leading-5.5 text-gray-900 outline-none placeholder:text-main-gray" />

                    <button type="button" onClick={() => void handleSubmit()} disabled={isPending || !content.trim()} aria-label="Отправить" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-40 sm:size-10">
                        <Send className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GeoChatRoom