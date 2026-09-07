"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import { ArrowDown, RefreshCw } from "lucide-react"
import type { RefObject, TouchEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import GeoChatMessageItem from "./GeoChatMessageItem"
import GeoChatMessageMenu, { type GeoChatMessageMenuPosition } from "./GeoChatMessageMenu"

type Props = {
    messages: GeoChatMessage[]
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

const MESSAGE_MENU_WIDTH = 170
const MESSAGE_MENU_GAP = 6
const VIEWPORT_MARGIN = 8

function GeoChatMessages({ messages, currentProfileId, canSend, isRefreshing, pullDistance, refreshReady, isPulling, messagesContainerRef, messagesEndRef, onTouchStart, onTouchMove, onTouchEnd, onReply, onEdit, onDelete, onError }: Props) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState<GeoChatMessageMenuPosition | null>(null)
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const messageMenuRef = useRef<HTMLDivElement>(null)
    const longPressTimerRef = useRef<number | null>(null)
    const highlightTimerRef = useRef<number | null>(null)

    const closeMessageMenu = useCallback(() => {
        setOpenMenuId(null)
        setMenuPosition(null)
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

    useEffect(() => {
        if (!openMenuId) return

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node

            if (messageMenuRef.current?.contains(target)) return

            closeMessageMenu()
        }

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                closeMessageMenu()
            }
        }

        const handleViewportChange = () => {
            closeMessageMenu()
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        window.addEventListener("resize", handleViewportChange)
        window.addEventListener("orientationchange", handleViewportChange)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("resize", handleViewportChange)
            window.removeEventListener("orientationchange", handleViewportChange)
        }
    }, [closeMessageMenu, openMenuId])

    useEffect(() => {
        if (!openMenuId) return

        const exists = messages.some((message) => message.id === openMenuId)

        if (!exists) {
            closeMessageMenu()
        }
    }, [closeMessageMenu, messages, openMenuId])

    const getMenuPosition = (element: HTMLElement, isOwnMessage: boolean): GeoChatMessageMenuPosition => {
        const rect = element.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const menuHeight = isOwnMessage ? 168 : 88
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top

        let top: number

        if (spaceBelow >= menuHeight + MESSAGE_MENU_GAP + VIEWPORT_MARGIN) {
            top = rect.bottom + MESSAGE_MENU_GAP
        } else if (spaceAbove >= menuHeight + MESSAGE_MENU_GAP + VIEWPORT_MARGIN) {
            top = rect.top - menuHeight - MESSAGE_MENU_GAP
        } else {
            top = Math.max(VIEWPORT_MARGIN, Math.min(rect.top, viewportHeight - menuHeight - VIEWPORT_MARGIN))
        }

        const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.right - MESSAGE_MENU_WIDTH, viewportWidth - MESSAGE_MENU_WIDTH - VIEWPORT_MARGIN))

        return {
            top,
            left
        }
    }

    const openMessageMenu = (messageId: string, anchor?: HTMLElement) => {
        if (openMenuId === messageId) {
            closeMessageMenu()
            return
        }

        const message = messages.find((item) => item.id === messageId)
        const element = anchor ?? messageRefs.current.get(messageId)

        if (!message || !element) return

        setMenuPosition(getMenuPosition(element, message.userId === currentProfileId))
        setOpenMenuId(messageId)
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
            const message = messages.find((item) => item.id === messageId)
            const element = messageRefs.current.get(messageId)

            if (message && element) {
                setMenuPosition(getMenuPosition(element, message.userId === currentProfileId))
                setOpenMenuId(messageId)
            }

            longPressTimerRef.current = null
        }, 500)
    }

    const setMessageRef = (messageId: string, element: HTMLDivElement | null) => {
        if (element) {
            messageRefs.current.set(messageId, element)
            return
        }

        messageRefs.current.delete(messageId)
    }

    const scrollToMessage = (messageId: string) => {
        const element = messageRefs.current.get(messageId)

        if (!element) {
            onError("Исходное сообщение пока не загружено")
            return
        }

        closeMessageMenu()

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

    const handleCopy = async (message: GeoChatMessage) => {
        closeMessageMenu()

        try {
            await navigator.clipboard.writeText(message.content)
        } catch (error) {
            console.error("GEO CHAT COPY ERROR:", error)
            onError("Не удалось скопировать сообщение")
        }
    }

    const openMenuMessage = openMenuId ? messages.find((message) => message.id === openMenuId) ?? null : null

    return (
        <>
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

                <div ref={messagesContainerRef} onScroll={closeMessageMenu} onTouchStart={(event) => { closeMessageMenu(); onTouchStart(event) }} onTouchMove={(event) => { clearLongPress(); onTouchMove(event) }} onTouchEnd={() => { clearLongPress(); onTouchEnd() }} onTouchCancel={() => { clearLongPress(); onTouchEnd() }} className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5" style={{ transform: `translateY(${isRefreshing ? 54 : pullDistance}px)`, transition: isPulling ? "none" : "transform 180ms ease-out" }}>
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
                                <GeoChatMessageItem key={message.id} message={message} highlighted={highlightedMessageId === message.id} onSetRef={setMessageRef} onOpenMenu={openMessageMenu} onStartLongPress={startLongPress} onClearLongPress={clearLongPress} onScrollToReply={scrollToMessage} />
                            ))}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            <GeoChatMessageMenu message={openMenuMessage} position={menuPosition} menuRef={messageMenuRef} currentProfileId={currentProfileId} canSend={canSend} onReply={(message) => { closeMessageMenu(); onReply(message) }} onCopy={(message) => { void handleCopy(message) }} onEdit={(message) => { closeMessageMenu(); onEdit(message) }} onDelete={(message) => { closeMessageMenu(); onDelete(message) }} />
        </>
    )
}

export default GeoChatMessages
