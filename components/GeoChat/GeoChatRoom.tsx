"use client"

import { createGeoChatMessage } from "@/actions/createGeoChatMessage"
import { getGeoChatMessages } from "@/actions/getGeoChatMessages"
import { createClient } from "@/lib/supabase/client"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import type { Profile } from "@/types/social"
import { ArrowDown, ArrowLeft, Copy, CornerUpLeft, Hash, MapPin, MoreHorizontal, Paperclip, RefreshCw, Send, Smile, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { KeyboardEvent, TouchEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import useGeoChatLiveAccess from "./useGeoChatLiveAccess"

type Props = {
    room: GeoChatRoomType
    initialMessages: GeoChatMessage[]
    currentProfile: Profile
}

const REFRESH_THRESHOLD = 70
const MAX_PULL_DISTANCE = 95

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
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const [replyingTo, setReplyingTo] = useState<GeoChatMessage | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

    const { status: accessStatus, error: accessError, accuracy, isTestAccess, canSend } = useGeoChatLiveAccess(room.id)

    const submitLockRef = useRef(false)
    const refreshLockRef = useRef(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const touchStartYRef = useRef<number | null>(null)
    const isPullingRef = useRef(false)
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const longPressTimerRef = useRef<number | null>(null)
    const highlightTimerRef = useRef<number | null>(null)

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow
        const previousHtmlOverflow = document.documentElement.style.overflow
        const previousBodyOverscroll = document.body.style.overscrollBehavior
        const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"
        document.body.style.overscrollBehavior = "none"
        document.documentElement.style.overscrollBehavior = "none"

        return () => {
            document.body.style.overflow = previousBodyOverflow
            document.documentElement.style.overflow = previousHtmlOverflow
            document.body.style.overscrollBehavior = previousBodyOverscroll
            document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
        }
    }, [])

    useEffect(() => {
        return () => {
            if (longPressTimerRef.current !== null) {
                window.clearTimeout(longPressTimerRef.current)
            }

            if (highlightTimerRef.current !== null) {
                window.clearTimeout(highlightTimerRef.current)
            }
        }
    }, [])

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
                behavior,
                block: "end"
            })
        })
    }, [])

    const isNearBottom = useCallback(() => {
        const container = messagesContainerRef.current

        if (!container) return true

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight

        return distanceFromBottom < 160
    }, [])

    useEffect(() => {
        scrollToBottom("instant")
    }, [scrollToBottom])

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`geo-chat:${room.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "geo_chat_messages",
                    filter: `chat_id=eq.${room.id}`
                },
                async (payload) => {
                    if (process.env.NODE_ENV === "development") {
                        console.log("GEO CHAT REALTIME INSERT:", payload)
                    }

                    const row = payload.new as {
                        id: string
                        chat_id: string
                        user_id: string
                        content: string
                        reply_to_id: string | null
                        created_at: string
                        updated_at: string
                    }

                    const shouldScroll = isNearBottom()

                    const { data: author, error: authorError } = await supabase
                        .from("profiles")
                        .select("username,display_name,avatar_url")
                        .eq("id", row.user_id)
                        .single()

                    if (authorError || !author) {
                        console.error("GEO CHAT REALTIME AUTHOR ERROR:", authorError)
                        return
                    }

                    let replyTo: GeoChatMessage["replyTo"] = null

                    if (row.reply_to_id) {
                        const { data: replyMessage, error: replyMessageError } = await supabase
                            .from("geo_chat_messages")
                            .select("id,user_id,content")
                            .eq("id", row.reply_to_id)
                            .maybeSingle()

                        if (replyMessageError) {
                            console.error("GEO CHAT REALTIME REPLY LOAD ERROR:", replyMessageError)
                        }

                        if (replyMessage) {
                            const { data: replyAuthor, error: replyAuthorError } = await supabase
                                .from("profiles")
                                .select("username,display_name")
                                .eq("id", replyMessage.user_id)
                                .maybeSingle()

                            if (replyAuthorError) {
                                console.error("GEO CHAT REALTIME REPLY AUTHOR ERROR:", replyAuthorError)
                            }

                            if (replyAuthor) {
                                replyTo = {
                                    id: replyMessage.id,
                                    authorUsername: replyAuthor.username,
                                    authorDisplayName: replyAuthor.display_name ?? replyAuthor.username,
                                    content: replyMessage.content
                                }
                            }
                        }
                    }

                    const newMessage: GeoChatMessage = {
                        id: row.id,
                        chatId: row.chat_id,
                        userId: row.user_id,
                        content: row.content,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                        authorUsername: author.username,
                        authorDisplayName: author.display_name ?? author.username,
                        authorAvatarUrl: author.avatar_url,
                        replyTo
                    }

                    setMessages((prev) => {
                        if (prev.some((message) => message.id === newMessage.id)) {
                            return prev
                        }

                        return [...prev, newMessage]
                    })

                    if (shouldScroll) {
                        scrollToBottom()
                    }
                }
            )

        const subscribe = async () => {
            const {
                data: { session },
                error: sessionError
            } = await supabase.auth.getSession()

            if (sessionError) {
                console.error("GEO CHAT REALTIME SESSION ERROR:", sessionError)
                return
            }

            if (!session) {
                console.error("GEO CHAT REALTIME: NO SESSION")
                return
            }

            supabase.realtime.setAuth(session.access_token)

            channel.subscribe((status, realtimeError) => {
                if (process.env.NODE_ENV === "development") {
                    console.log("GEO CHAT REALTIME STATUS:", status, realtimeError ?? "")
                }

                if (status === "CHANNEL_ERROR") {
                    console.error("GEO CHAT REALTIME CHANNEL ERROR:", realtimeError)
                }
            })
        }

        void subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [isNearBottom, room.id, scrollToBottom])

    const refreshMessages = async () => {
        if (refreshLockRef.current) return

        refreshLockRef.current = true
        setIsRefreshing(true)
        setError("")

        try {
            const result = await getGeoChatMessages(room.id)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setMessages(result.messages)
        } catch (error) {
            console.error("GEO CHAT REFRESH ERROR:", error)
            setError("Не удалось обновить сообщения")
        } finally {
            setPullDistance(0)
            setIsRefreshing(false)
            refreshLockRef.current = false
        }
    }

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        const container = messagesContainerRef.current

        if (!container) return
        if (container.scrollTop > 0) return
        if (isRefreshing) return

        touchStartYRef.current = event.touches[0]?.clientY ?? null
        isPullingRef.current = false
    }

    const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        const container = messagesContainerRef.current
        const startY = touchStartYRef.current
        const currentY = event.touches[0]?.clientY

        if (!container) return
        if (startY === null || currentY === undefined) return
        if (container.scrollTop > 0) return
        if (isRefreshing) return

        const distance = currentY - startY

        if (distance <= 0) {
            setPullDistance(0)
            isPullingRef.current = false
            return
        }

        isPullingRef.current = true

        const resistanceDistance = Math.min(distance * 0.55, MAX_PULL_DISTANCE)

        setPullDistance(resistanceDistance)
    }

    const handleTouchEnd = () => {
        touchStartYRef.current = null

        if (!isPullingRef.current) {
            setPullDistance(0)
            return
        }

        isPullingRef.current = false

        if (pullDistance >= REFRESH_THRESHOLD) {
            void refreshMessages()
            return
        }

        setPullDistance(0)
    }

    const clearLongPress = () => {
        if (longPressTimerRef.current !== null) {
            window.clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
    }

    const startLongPress = (messageId: string) => {
        clearLongPress()

        longPressTimerRef.current = window.setTimeout(() => {
            setOpenMenuId(messageId)
            longPressTimerRef.current = null
        }, 500)
    }

    const handleReplyToMessage = (message: GeoChatMessage) => {
        if (!canSend) return

        setReplyingTo(message)
        setOpenMenuId(null)
        setError("")

        requestAnimationFrame(() => {
            textareaRef.current?.focus()
        })
    }

    const handleCopyMessage = async (message: GeoChatMessage) => {
        setOpenMenuId(null)

        try {
            await navigator.clipboard.writeText(message.content)
        } catch (error) {
            console.error("GEO CHAT COPY ERROR:", error)
            setError("Не удалось скопировать сообщение")
        }
    }

    const scrollToMessage = (messageId: string) => {
        const element = messageRefs.current.get(messageId)

        if (!element) {
            setError("Исходное сообщение пока не загружено")
            return
        }

        element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        })

        setHighlightedMessageId(messageId)

        if (highlightTimerRef.current !== null) {
            window.clearTimeout(highlightTimerRef.current)
        }

        highlightTimerRef.current = window.setTimeout(() => {
            setHighlightedMessageId(null)
            highlightTimerRef.current = null
        }, 1600)
    }

    const handleSubmit = async () => {
        if (submitLockRef.current) return

        if (!canSend) {
            setError("Вы находитесь вне зоны этого геочата")
            return
        }

        const normalizedContent = content.trim()

        if (!normalizedContent) return

        submitLockRef.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createGeoChatMessage(room.id, normalizedContent, replyingTo?.id ?? null)

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
                authorAvatarUrl: currentProfile.avatar_url,
                replyTo: replyingTo ? {
                    id: replyingTo.id,
                    authorUsername: replyingTo.authorUsername,
                    authorDisplayName: replyingTo.authorDisplayName,
                    content: replyingTo.content
                } : null
            }

            setMessages((prev) => {
                if (prev.some((message) => message.id === newMessage.id)) {
                    return prev
                }

                return [...prev, newMessage]
            })

            setContent("")
            setReplyingTo(null)

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

    const refreshReady = pullDistance >= REFRESH_THRESHOLD

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

                        <div className="flex items-center gap-1.5 text-[11px] text-main-gray sm:text-xs">
                            <span>Радиус {Math.round(room.radiusM / 1000)} км</span>

                            {isTestAccess ? (
                                <span className="text-main-green">· тест</span>
                            ) : accuracy !== null ? (
                                <span>· ±{Math.round(accuracy)} м</span>
                            ) : null}
                        </div>
                    </div>
                </div>

                <button type="button" aria-label="Меню геочата" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-10">
                    <MoreHorizontal className="size-5" />
                </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center overflow-hidden" style={{ height: `${isRefreshing ? 54 : pullDistance}px` }}>
                    <div className="flex h-[54] items-center justify-center gap-2 text-xs font-medium text-main-gray">
                        {isRefreshing ? (
                            <>
                                <RefreshCw className="size-4 animate-spin text-main-green" />
                                <span>Обновляем сообщения...</span>
                            </>
                        ) : refreshReady ? (
                            <>
                                <RefreshCw className="size-4 text-main-green" />
                                <span className="text-main-green">Отпустите для обновления</span>
                            </>
                        ) : pullDistance > 8 ? (
                            <>
                                <ArrowDown className="size-4 text-main-green" />
                                <span>Потяните для обновления</span>
                            </>
                        ) : null}
                    </div>
                </div>

                <div ref={messagesContainerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd} className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5" style={{ transform: `translateY(${isRefreshing ? 54 : pullDistance}px)`, transition: isPullingRef.current ? "none" : "transform 180ms ease-out" }}>
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
                                <div key={message.id} ref={(element) => { if (element) messageRefs.current.set(message.id, element); else messageRefs.current.delete(message.id) }} onContextMenu={(event) => { event.preventDefault(); setOpenMenuId(message.id) }} onTouchStart={() => startLongPress(message.id)} onTouchEnd={clearLongPress} onTouchMove={clearLongPress} onTouchCancel={clearLongPress} className={`flex items-end gap-2 rounded-2xl transition-colors ${highlightedMessageId === message.id ? "bg-green-50" : ""}`}>
                                    <Link href={`/profile/${message.authorUsername}`} className="relative mb-5 size-8 shrink-0 overflow-hidden rounded-full bg-bg-green sm:size-9">
                                        <Image src={message.authorAvatarUrl ?? "/user-avatar.svg"} alt={message.authorDisplayName} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                                    </Link>

                                    <div className="min-w-0 max-w-[620] flex-1">
                                        <div className="group relative rounded-[18px] bg-[#f2f3f2] px-3 py-2.5 pr-9 sm:rounded-[20px] sm:px-4 sm:pr-10">
                                            <Link href={`/profile/${message.authorUsername}`} className="text-xs font-semibold text-main-green hover:underline sm:text-sm">
                                                {message.authorDisplayName}
                                            </Link>

                                            <button type="button" onClick={() => setOpenMenuId((current) => current === message.id ? null : message.id)} aria-label="Меню сообщения" className="absolute right-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900 sm:opacity-0 sm:group-hover:opacity-100">
                                                <MoreHorizontal className="size-4" />
                                            </button>

                                            {message.replyTo && (
                                                <button type="button" onClick={() => scrollToMessage(message.replyTo!.id)} className="mt-1.5 mb-2 block w-full cursor-pointer rounded-xl border-l-2 border-main-green bg-white/70 px-3 py-2 text-left transition-colors hover:bg-white">
                                                    <div className="truncate text-xs font-semibold text-main-green">
                                                        Ответ {message.replyTo.authorDisplayName}
                                                    </div>

                                                    <div className="mt-0.5 truncate text-xs text-main-gray">
                                                        {message.replyTo.content}
                                                    </div>
                                                </button>
                                            )}

                                            <div className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-900 sm:text-[15px] sm:leading-6">
                                                {message.content}
                                            </div>

                                            {openMenuId === message.id && (
                                                <>
                                                    <button type="button" aria-label="Закрыть меню" onClick={() => setOpenMenuId(null)} className="fixed inset-0 z-60 cursor-default" />

                                                    <div className="absolute right-2 top-9 z-70 w-[170] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                                                        <button type="button" disabled={!canSend} onClick={() => handleReplyToMessage(message)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40">
                                                            <CornerUpLeft className="size-4 text-main-gray" />
                                                            <span>Ответить</span>
                                                        </button>

                                                        <button type="button" onClick={() => void handleCopyMessage(message)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50">
                                                            <Copy className="size-4 text-main-gray" />
                                                            <span>Копировать</span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
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
            </div>

            {accessStatus !== "active" && (
                <div className="shrink-0 border-t border-gray-100 bg-white px-2 pt-2 sm:px-4 sm:pt-3">
                    <div className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 ${accessStatus === "outside" ? "bg-amber-50" : accessStatus === "checking" ? "bg-gray-50" : "bg-red-50"}`}>
                        <div className="flex items-start gap-2.5">
                            {accessStatus === "checking" ? (
                                <RefreshCw className="mt-0.5 size-4 shrink-0 animate-spin text-main-green" />
                            ) : (
                                <MapPin className={`mt-0.5 size-4 shrink-0 ${accessStatus === "outside" ? "text-amber-600" : "text-red-500"}`} />
                            )}

                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900">
                                    {accessStatus === "checking" && "Проверяем местоположение"}
                                    {accessStatus === "outside" && "Вы вышли из зоны геочата"}
                                    {accessStatus === "denied" && "Доступ к геолокации запрещён"}
                                    {accessStatus === "unsupported" && "Геолокация недоступна"}
                                    {accessStatus === "error" && "Не удалось проверить местоположение"}
                                </div>

                                <div className="mt-1 text-xs leading-5 text-main-gray">
                                    {accessStatus === "checking" && "Проверяем, находитесь ли вы в зоне этого геочата."}
                                    {accessStatus === "outside" && "Отправка сообщений временно недоступна. Вернитесь в зону геочата, и отправка включится автоматически."}
                                    {accessStatus === "denied" && "Разрешите ВСети доступ к местоположению в настройках браузера или телефона."}
                                    {accessStatus === "unsupported" && "На этом устройстве невозможно получить текущее местоположение."}
                                    {accessStatus === "error" && (accessError || "Не удалось получить актуальную геопозицию.")}
                                </div>

                                {accessStatus !== "checking" && (
                                    <Link href="/geochats" className="mt-1.5 inline-flex text-xs font-semibold text-main-green hover:underline">
                                        Вернуться к геочатам
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="shrink-0 border-t border-gray-100 bg-white px-2 py-2 sm:p-4">
                {error && (
                    <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                    </div>
                )}

                {replyingTo && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                        <CornerUpLeft className="size-4 shrink-0 text-main-green" />

                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-main-green">
                                Ответ {replyingTo.authorDisplayName}
                            </div>

                            <div className="mt-0.5 truncate text-xs text-main-gray">
                                {replyingTo.content}
                            </div>
                        </div>

                        <button type="button" onClick={() => setReplyingTo(null)} aria-label="Отменить ответ" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900">
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 sm:gap-2 sm:p-2">
                    <button type="button" disabled={!canSend} aria-label="Прикрепить файл" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-40 sm:size-9">
                        <Paperclip className="size-4 sm:size-5" />
                    </button>

                    <button type="button" disabled={!canSend} aria-label="Эмодзи" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-40 sm:size-9">
                        <Smile className="size-4 sm:size-5" />
                    </button>

                    <textarea ref={textareaRef} value={content} disabled={!canSend} onKeyDown={handleKeyDown} onFocus={() => scrollToBottom()} onChange={(event) => { setContent(event.target.value); setError(""); event.currentTarget.style.height = "38px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 100); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 100 ? "auto" : "hidden" }} placeholder={canSend ? replyingTo ? `Ответ ${replyingTo.authorDisplayName}...` : "Написать сообщение..." : accessStatus === "checking" ? "Проверяем местоположение..." : "Вы вне зоны геочата"} maxLength={4000} rows={1} className="min-h-[38] max-h-[100] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-1 py-2 text-sm leading-5.5 text-gray-900 outline-none placeholder:text-main-gray disabled:cursor-not-allowed disabled:opacity-50" />

                    <button type="button" onClick={() => void handleSubmit()} disabled={!canSend || isPending || !content.trim()} aria-label="Отправить" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-40 sm:size-10">
                        <Send className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GeoChatRoom