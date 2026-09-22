"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"
import type { GeoChatMessageReaction } from "@/types/geoChatReactions"
import Image from "next/image"
import Link from "next/link"
import GeoChatMessageAttachments from "./GeoChatMessageAttachments"
import GeoChatMessageReactions from "./GeoChatMessageReactions"

type Props = {
    message: GeoChatMessage
    currentProfileId: string
    highlighted: boolean
    reactions: GeoChatMessageReaction[]
    attachments: GeoChatMessageAttachment[]
    pendingReactionKeys: Set<string>
    canReact: boolean
    eagerAttachments?: boolean
    onToggleReaction: (messageId: string, emoji: string) => void
    onSetRef: (messageId: string, element: HTMLDivElement | null) => void
    onOpenMenu: (messageId: string, anchor?: HTMLElement) => void
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

function isMessageEdited(
    message: GeoChatMessage
) {
    const createdAt =
        new Date(
            message.createdAt
        ).getTime()

    const updatedAt =
        new Date(
            message.updatedAt
        ).getTime()

    return (
        updatedAt -
        createdAt >
        1000
    )
}

function GeoChatMessageItem({
    message,
    currentProfileId,
    highlighted,
    reactions,
    attachments,
    pendingReactionKeys,
    canReact,
    eagerAttachments = false,
    onToggleReaction,
    onSetRef,
    onOpenMenu,
    onStartLongPress,
    onClearLongPress,
    onScrollToReply
}: Props) {
    const isOwnMessage =
        message.userId ===
        currentProfileId

    const hasContent =
        message.content
            .trim()
            .length > 0

    return (
        <div className={`flex w-full items-end gap-2 rounded-2xl transition-colors ${isOwnMessage ? "justify-end" : "justify-start"} ${highlighted ? "bg-green-50" : ""}`}>
            {!isOwnMessage && (
                <Link href={`/profile/${message.authorUsername}`} className="relative mb-5 size-8 shrink-0 overflow-hidden rounded-full bg-bg-green sm:size-9">
                    <Image
                        src={message.authorAvatarUrl ?? "/user-avatar.svg"}
                        alt={
                            message.authorDisplayName
                        }
                        fill
                        sizes="36px"
                        unoptimized={
                            process.env
                                .NODE_ENV ===
                            "development"
                        }
                        className="object-cover"
                    />
                </Link>
            )}

            <div
                ref={(element) =>
                    onSetRef(
                        message.id,
                        element
                    )
                }
                onContextMenu={(
                    event
                ) => {
                    event.preventDefault()

                    onOpenMenu(
                        message.id
                    )
                }}
                onTouchStart={() =>
                    onStartLongPress(
                        message.id
                    )
                }
                onTouchEnd={
                    onClearLongPress
                }
                onTouchMove={
                    onClearLongPress
                }
                onTouchCancel={
                    onClearLongPress
                }
                className={`min-w-0 max-w-[82%] select-none sm:max-w-155 ${isOwnMessage ? "ml-auto" : "mr-auto"}`}
            >
                <div className={`relative rounded-[18px] px-3 py-2.5 sm:rounded-[20px] sm:px-4 ${isOwnMessage ? "bg-[#e7f8ed]" : "bg-[#f2f3f2]"}`}>

                    {!isOwnMessage && (
                        <div className="text-xs font-semibold text-main-green sm:text-sm">
                            {message.authorDisplayName}
                        </div>
                    )}

                    {message.replyTo && (
                        <button
                            type="button"
                            onClick={() =>
                                onScrollToReply(
                                    message
                                        .replyTo!
                                        .id
                                )
                            }
                            className="mb-2 mt-1.5 block w-full cursor-pointer rounded-xl border-l-2 border-main-green bg-white/70 px-3 py-2 text-left transition-colors hover:bg-white"
                        >
                            <div className="truncate text-xs font-semibold text-main-green">
                                Ответ{" "}
                                {
                                    message
                                        .replyTo
                                        .authorDisplayName
                                }
                            </div>

                            <div className="mt-0.5 truncate text-xs text-main-gray">
                                {message
                                    .replyTo
                                    .content ||
                                    "Изображение"}
                            </div>
                        </button>
                    )}

                    <GeoChatMessageAttachments
                        attachments={
                            attachments
                        }
                        expectedCount={Math.max(
                            message.attachmentCount ??
                            0,
                            attachments.length
                        )}
                        eager={
                            eagerAttachments
                        }
                    />

                    {hasContent && (
                        <div className={`${attachments.length > 0 ? "mt-2" : !isOwnMessage ? "mt-0.5" : ""} whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-900 sm:text-[15px] sm:leading-6`}>
                            {
                                message.content
                            }
                        </div>
                    )}
                </div>

                <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <GeoChatMessageReactions
                        messageId={
                            message.id
                        }
                        reactions={
                            reactions
                        }
                        canReact={
                            canReact
                        }
                        pendingKeys={
                            pendingReactionKeys
                        }
                        onToggle={
                            onToggleReaction
                        }
                    />
                </div>

                <div className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-main-gray sm:text-xs ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <span>
                        {formatMessageDate(
                            message.createdAt
                        )}
                    </span>

                    {isMessageEdited(
                        message
                    ) && (
                            <span>
                                · изменено
                            </span>
                        )}
                </div>
            </div>
        </div>
    )
}

export default GeoChatMessageItem