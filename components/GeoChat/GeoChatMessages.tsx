"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import type { GeoChatMessageAttachmentMap } from "@/types/geoChatAttachments"
import { ArrowDown, RefreshCw } from "lucide-react"
import type { RefObject, TouchEvent } from "react"
import { useMemo } from "react"
import GeoChatMessageItem from "./GeoChatMessageItem"
import GeoChatMessageMenu from "./GeoChatMessageMenu"
import useGeoChatMessageMenu from "./useGeoChatMessageMenu"
import useGeoChatMessageReactions from "./useGeoChatMessageReactions"

type Props = {
    messages: GeoChatMessage[]
    attachmentsByMessage: GeoChatMessageAttachmentMap
    currentProfileId: string
    canSend: boolean
    isRefreshing: boolean
    pullDistance: number
    refreshReady: boolean
    isPulling: boolean
    messagesContainerRef: RefObject<HTMLDivElement | null>
    messagesEndRef: RefObject<HTMLDivElement | null>
    onTouchStart: (event: TouchEvent<HTMLDivElement>) => void
    onTouchMove: (event: TouchEvent<HTMLDivElement>) => void
    onTouchEnd: () => void
    onReply: (message: GeoChatMessage) => void
    onEdit: (message: GeoChatMessage) => void
    onDelete: (message: GeoChatMessage) => void
    onError: (message: string) => void
}

function GeoChatMessages({
    messages,
    attachmentsByMessage,
    currentProfileId,
    canSend,
    isRefreshing,
    pullDistance,
    refreshReady,
    isPulling,
    messagesContainerRef,
    messagesEndRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onReply,
    onEdit,
    onDelete,
    onError
}: Props) {
    const {
        reactionsByMessage,
        pendingKeys: pendingReactionKeys,
        toggleReaction
    } = useGeoChatMessageReactions(messages, onError)

    const eagerAttachmentMessageIds = useMemo(() => {
        const ids = messages
            .filter(
                (message) =>
                    (message.attachmentCount ?? 0) > 0 ||
                    (attachmentsByMessage[message.id]?.length ?? 0) > 0
            )
            .slice(-3)
            .map((message) => message.id)

        return new Set(ids)
    }, [
        attachmentsByMessage,
        messages
    ])

    const menu = useGeoChatMessageMenu({
        messages,
        currentProfileId,
        messagesContainerRef,
        onError
    })

    const openMenuReactions =
        menu.openMenuMessage
            ? reactionsByMessage[menu.openMenuMessage.id] ?? []
            : []

    return (
        <>
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center overflow-hidden"
                    style={{
                        height: `${isRefreshing ? 54 : pullDistance}px`
                    }}
                >
                    <div className="flex h-[54] items-center justify-center gap-2 text-xs font-medium text-main-gray">
                        {isRefreshing ? (
                            <>
                                <RefreshCw className="size-4 animate-spin text-main-green" />
                                <span>
                                    Обновляем сообщения...
                                </span>
                            </>
                        ) : refreshReady ? (
                            <>
                                <RefreshCw className="size-4 text-main-green" />
                                <span className="text-main-green">
                                    Отпустите для обновления
                                </span>
                            </>
                        ) : pullDistance > 8 ? (
                            <>
                                <ArrowDown className="size-4 text-main-green" />
                                <span>
                                    Потяните для обновления
                                </span>
                            </>
                        ) : null}
                    </div>
                </div>

                <div
                    ref={messagesContainerRef}
                    onScroll={menu.closeMessageMenu}
                    onTouchStart={(event) => {
                        menu.closeMessageMenu()
                        onTouchStart(event)
                    }}
                    onTouchMove={(event) => {
                        menu.clearLongPress()
                        onTouchMove(event)
                    }}
                    onTouchEnd={() => {
                        menu.clearLongPress()
                        onTouchEnd()
                    }}
                    onTouchCancel={() => {
                        menu.clearLongPress()
                        onTouchEnd()
                    }}
                    className="h-full overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
                    style={{
                        transform: `translateY(${isRefreshing ? 54 : pullDistance}px)`,
                        transition: isPulling
                            ? "none"
                            : "transform 180ms ease-out"
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="flex h-full min-h-[220] items-center justify-center text-center">
                            <div className="max-w-[360]">
                                <div className="text-base font-semibold text-gray-900">
                                    Пока здесь тихо
                                </div>

                                <div className="mt-2 text-sm leading-6 text-main-gray">
                                    Напишите первое сообщение в этом геочате.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3.5 sm:gap-4">
                            {messages.map((message) => (
                                <GeoChatMessageItem
                                    key={message.id}
                                    message={message}
                                    currentProfileId={currentProfileId}
                                    highlighted={menu.highlightedMessageId === message.id}
                                    reactions={reactionsByMessage[message.id] ?? []}
                                    attachments={attachmentsByMessage[message.id] ?? []}
                                    pendingReactionKeys={pendingReactionKeys}
                                    canReact={canSend}
                                    eagerAttachments={eagerAttachmentMessageIds.has(message.id)}
                                    onToggleReaction={(messageId, emoji) => void toggleReaction(messageId, emoji)}
                                    onSetRef={menu.setMessageRef}
                                    onOpenMenu={menu.openMessageMenu}
                                    onStartLongPress={menu.startLongPress}
                                    onClearLongPress={menu.clearLongPress}
                                    onScrollToReply={menu.scrollToMessage}
                                />
                            ))}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            <GeoChatMessageMenu
                message={menu.openMenuMessage}
                position={menu.menuPosition}
                menuRef={menu.messageMenuRef}
                currentProfileId={currentProfileId}
                canSend={canSend}
                reactions={openMenuReactions}
                pendingReactionKeys={pendingReactionKeys}
                onToggleReaction={(messageId, emoji) => {
                    menu.closeMessageMenu()
                    void toggleReaction(messageId, emoji)
                }}
                onReply={(message) => {
                    menu.closeMessageMenu()
                    onReply(message)
                }}
                onCopy={(message) => void menu.handleCopy(message)}
                onEdit={(message) => {
                    menu.closeMessageMenu()
                    onEdit(message)
                }}
                onDelete={(message) => {
                    menu.closeMessageMenu()
                    onDelete(message)
                }}
            />
        </>
    )
}

export default GeoChatMessages