"use client"

import type { GeoChatMessage, GeoChatSenderRole } from "@/types/geoChat"
import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type Props = {
    message: GeoChatMessage
    highlighted: boolean
    onSetRef: (messageId: string, element: HTMLDivElement | null) => void
    onOpenMenu: (messageId: string, anchor: HTMLElement) => void
    onStartLongPress: (messageId: string) => void
    onClearLongPress: () => void
    onScrollToReply: (messageId: string) => void
}

function formatMessageDate(value: string) {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Minsk"
    }).format(new Date(value))
}

function isMessageEdited(message: GeoChatMessage) {
    const createdAt = new Date(message.createdAt).getTime()
    const updatedAt = new Date(message.updatedAt).getTime()

    return updatedAt - createdAt > 1000
}

function getRoleLabel(role: GeoChatSenderRole | null | undefined) {
    if (role === "admin") return "Администратор"
    if (role === "moderator") return "Модератор"

    return null
}

function GeoChatMessageItem({ message, highlighted, onSetRef, onOpenMenu, onStartLongPress, onClearLongPress, onScrollToReply }: Props) {
    const roleLabel = getRoleLabel(message.senderRole)

    return (
        <div ref={(element) => onSetRef(message.id, element)} onContextMenu={(event) => { event.preventDefault(); onOpenMenu(message.id, event.currentTarget) }} onTouchStart={() => onStartLongPress(message.id)} onTouchEnd={onClearLongPress} onTouchMove={onClearLongPress} onTouchCancel={onClearLongPress} className={`flex items-end gap-2 rounded-2xl transition-colors ${highlighted ? "bg-green-50" : ""}`}>
            <Link href={`/profile/${message.authorUsername}`} className="relative mb-5 size-8 shrink-0 overflow-hidden rounded-full bg-bg-green sm:size-9">
                <Image src={message.authorAvatarUrl ?? "/user-avatar.svg"} alt={message.authorDisplayName} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
            </Link>

            <div className="min-w-0 max-w-[620] flex-1">
                <div className="group relative rounded-[18px] bg-[#f2f3f2] px-3 py-2.5 pr-9 sm:rounded-[20px] sm:px-4 sm:pr-10">
                    <div className="flex min-w-0 items-center gap-2 pr-4">
                        <Link href={`/profile/${message.authorUsername}`} className="truncate text-xs font-semibold text-main-green hover:underline sm:text-sm">{message.authorDisplayName}</Link>

                        {roleLabel && <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-main-green">{roleLabel}</span>}
                    </div>

                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => onOpenMenu(message.id, event.currentTarget)} aria-label="Меню сообщения" className="absolute right-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900 sm:opacity-0 sm:group-hover:opacity-100">
                        <MoreHorizontal className="size-4" />
                    </button>

                    {message.replyTo && (
                        <button type="button" onClick={() => onScrollToReply(message.replyTo!.id)} className="mt-1.5 mb-2 block w-full cursor-pointer rounded-xl border-l-2 border-main-green bg-white/70 px-3 py-2 text-left transition-colors hover:bg-white">
                            <div className="truncate text-xs font-semibold text-main-green">Ответ {message.replyTo.authorDisplayName}</div>
                            <div className="mt-0.5 truncate text-xs text-main-gray">{message.replyTo.content}</div>
                        </button>
                    )}

                    <div className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5 text-gray-900 sm:text-[15px] sm:leading-6">{message.content}</div>
                </div>

                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-main-gray sm:text-xs">
                    <span>{formatMessageDate(message.createdAt)}</span>
                    {isMessageEdited(message) && <span>· изменено</span>}
                </div>
            </div>
        </div>
    )
}

export default GeoChatMessageItem
