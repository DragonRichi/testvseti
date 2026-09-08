"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import type { GeoChatMessageReaction } from "@/types/geoChatReactions"
import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import GeoChatMessageReactions from "./GeoChatMessageReactions"

type Props = {
    message: GeoChatMessage
    currentProfileId: string
    highlighted: boolean
    reactions: GeoChatMessageReaction[]
    pendingReactionKeys: Set<string>
    canReact: boolean
    onToggleReaction: (messageId: string, emoji: string) => void
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

function GeoChatMessageItem({
    message,
    currentProfileId,
    highlighted,
    reactions,
    pendingReactionKeys,
    canReact,
    onToggleReaction,
    onSetRef,
    onOpenMenu,
    onStartLongPress,
    onClearLongPress,
    onScrollToReply
}: Props) {
    const isOwnMessage = message.userId === currentProfileId

    return (
        <div
            ref={(element) => onSetRef(message.id, element)}
            onContextMenu={(event) => {
                event.preventDefault()
                onOpenMenu(message.id, event.currentTarget)
            }}
            onTouchStart={() => onStartLongPress(message.id)}
            onTouchEnd={onClearLongPress}
            onTouchMove={onClearLongPress}
            onTouchCancel={onClearLongPress}
            className={`flex w-full items-end gap-2 rounded-2xl transition-colors ${
                isOwnMessage ? "justify-end" : "justify-start"
            } ${highlighted ? "bg-green-50" : ""}`}
        >
            {!isOwnMessage && (
                <Link href={`/profile/${message.authorUsername}`} className="relative mb-5 size-8 shrink-0 overflow-hidden rounded-full bg-bg-green sm:size-9">
                    <Image
                        src={message.authorAvatarUrl ?? "/user-avatar.svg"}
                        alt={message.authorDisplayName}
                        fill
                        sizes="36px"
                        unoptimized={process.env.NODE_ENV === "development"}
                        className="object-cover"
                    />
                </Link>
            )}

            <div className={`min-w-0 max-w-[82%] sm:max-w-155 ${isOwnMessage ? "ml-auto" : "mr-auto"}`}>
                <div className={`group relative rounded-[18px] px-3 py-2.5 pr-9 sm:rounded-[20px] sm:px-4 sm:pr-10 ${
                    isOwnMessage ? "bg-[#e7f8ed]" : "bg-[#f2f3f2]"
                }`}>
                    {!isOwnMessage && (
                        <Link href={`/profile/${message.authorUsername}`} className="text-xs font-semibold text-main-green hover:underline sm:text-sm">
                            {message.authorDisplayName}
                        </Link>
                    )}

                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => onOpenMenu(message.id, event.currentTarget)}
                        aria-label="Меню сообщения"
                        className={`absolute right-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:text-gray-900 sm:opacity-0 sm:group-hover:opacity-100 ${
                            isOwnMessage ? "hover:bg-white/70" : "hover:bg-white"
                        }`}
                    >
                        <MoreHorizontal className="size-4" />
                    </button>

                    {message.replyTo && (
                        <button
                            type="button"
                            onClick={() => onScrollToReply(message.replyTo!.id)}
                            className="mb-2 mt-1.5 block w-full cursor-pointer rounded-xl border-l-2 border-main-green bg-white/70 px-3 py-2 text-left transition-colors hover:bg-white"
                        >
                            <div className="truncate text-xs font-semibold text-main-green">
                                Ответ {message.replyTo.authorDisplayName}
                            </div>

                            <div className="mt-0.5 truncate text-xs text-main-gray">
                                {message.replyTo.content}
                            </div>
                        </button>
                    )}

                    <div className={`${isOwnMessage ? "" : "mt-0.5"} whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-900 sm:text-[15px] sm:leading-6`}>
                        {message.content}
                    </div>
                </div>

                <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <GeoChatMessageReactions
                        messageId={message.id}
                        reactions={reactions}
                        canReact={canReact}
                        pendingKeys={pendingReactionKeys}
                        onToggle={onToggleReaction}
                    />
                </div>

                <div className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-main-gray sm:text-xs ${
                    isOwnMessage ? "justify-end" : "justify-start"
                }`}>
                    <span>{formatMessageDate(message.createdAt)}</span>

                    {isMessageEdited(message) && (
                        <span>· изменено</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GeoChatMessageItem