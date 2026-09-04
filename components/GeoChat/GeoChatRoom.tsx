"use client"

import { createGeoChatMessage } from "@/actions/createGeoChatMessage"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import type { Profile } from "@/types/social"
import { ArrowLeft, Hash, MoreHorizontal, Paperclip, Send, Smile } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "instant"
        })
    }, [])

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth"
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
                textareaRef.current.style.height = "42px"
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

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter") return
        if (event.shiftKey) return

        event.preventDefault()
        void handleSubmit()
    }

    return (
        <div className="flex h-[calc(100dvh-104px)] min-h-[520] flex-col overflow-hidden rounded-3xl border border-green-100 bg-white lg:h-[calc(100dvh-32px)]">
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <Link href="/geochats" aria-label="Назад к геочатам" className="flex size-9 shrink-0 items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <ArrowLeft className="size-5" />
                    </Link>

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <Hash className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="truncate text-base font-bold text-gray-900 sm:text-lg">#{room.name}</div>
                        <div className="mt-0.5 text-xs text-main-gray">Радиус {Math.round(room.radiusM / 1000)} км</div>
                    </div>
                </div>

                <button type="button" aria-label="Меню геочата" className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900">
                    <MoreHorizontal className="size-5" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
                {messages.length === 0 ? (
                    <div className="flex h-full min-h-[300] items-center justify-center text-center">
                        <div className="max-w-[360]">
                            <div className="text-base font-semibold text-gray-900">Пока здесь тихо</div>
                            <div className="mt-2 text-sm leading-6 text-main-gray">Напишите первое сообщение в этом геочате.</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <div key={message.id} className="flex items-end gap-2.5">
                                <Link href={`/profile/${message.authorUsername}`} className="relative mb-5 size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                    <Image src={message.authorAvatarUrl ?? "/user-avatar.svg"} alt={message.authorDisplayName} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                                </Link>

                                <div className="min-w-0 max-w-[620] flex-1">
                                    <div className="rounded-[20px] bg-[#f2f3f2] px-3.5 py-2.5 sm:px-4">
                                        <Link href={`/profile/${message.authorUsername}`} className="text-sm font-medium text-main-green hover:underline">
                                            {message.authorDisplayName}
                                        </Link>

                                        <div className="mt-0.5 whitespace-pre-wrap wrap-break-word text-[15px] leading-6 text-gray-900">
                                            {message.content}
                                        </div>
                                    </div>

                                    <div className="mt-1 px-1 text-xs text-main-gray">
                                        {formatMessageDate(message.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white p-3 sm:p-4">
                {error && (
                    <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2">
                    <button type="button" aria-label="Прикрепить файл" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50">
                        <Paperclip className="size-5" />
                    </button>

                    <button type="button" aria-label="Эмодзи" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50">
                        <Smile className="size-5" />
                    </button>

                    <textarea ref={textareaRef} value={content} onKeyDown={handleKeyDown} onChange={(event) => { setContent(event.target.value); setError(""); event.currentTarget.style.height = "42px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 120); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 120 ? "auto" : "hidden" }} placeholder="Написать сообщение..." maxLength={4000} rows={1} className="min-h-[42] max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-1 py-2.5 text-sm leading-5 text-gray-900 outline-none placeholder:text-main-gray" />

                    <button type="button" onClick={() => void handleSubmit()} disabled={isPending || !content.trim()} aria-label="Отправить" className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-40">
                        <Send className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GeoChatRoom