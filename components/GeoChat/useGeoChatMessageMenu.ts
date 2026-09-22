"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import type { RefObject } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { GeoChatMessageMenuPosition } from "./GeoChatMessageMenu"

type Options = {
    messages: GeoChatMessage[]
    currentProfileId: string
    messagesContainerRef: RefObject<HTMLDivElement | null>
    onError: (message: string) => void
}

const MESSAGE_MENU_WIDTH = 220
const MESSAGE_MENU_GAP = 6
const VIEWPORT_MARGIN = 8

function getViewportBounds() {
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft ?? 0
    const top = viewport?.offsetTop ?? 0
    const width = viewport?.width ?? window.innerWidth
    const height = viewport?.height ?? window.innerHeight

    return { left, top, right: left + width, bottom: top + height }
}

function getMenuPosition(element: HTMLElement, isOwnMessage: boolean): GeoChatMessageMenuPosition {
    const rect = element.getBoundingClientRect()
    const viewport = getViewportBounds()
    const menuHeight = isOwnMessage ? 220 : 138
    const sideGap = 10
    const minLeft = viewport.left + VIEWPORT_MARGIN
    const maxLeft = Math.max(minLeft, viewport.right - MESSAGE_MENU_WIDTH - VIEWPORT_MARGIN)
    const minTop = viewport.top + VIEWPORT_MARGIN
    const maxTop = Math.max(minTop, viewport.bottom - menuHeight - VIEWPORT_MARGIN)
    const clampLeft = (value: number) => Math.max(minLeft, Math.min(value, maxLeft))
    const clampTop = (value: number) => Math.max(minTop, Math.min(value, maxTop))
    const rightLeft = rect.right + sideGap
    const leftLeft = rect.left - MESSAGE_MENU_WIDTH - sideGap
    const fitsRight = rightLeft + MESSAGE_MENU_WIDTH <= viewport.right - VIEWPORT_MARGIN
    const fitsLeft = leftLeft >= viewport.left + VIEWPORT_MARGIN

    if (!isOwnMessage && fitsRight) return { top: clampTop(rect.top), left: rightLeft }
    if (isOwnMessage && fitsLeft) return { top: clampTop(rect.top), left: leftLeft }
    if (!isOwnMessage && fitsLeft) return { top: clampTop(rect.top), left: leftLeft }
    if (isOwnMessage && fitsRight) return { top: clampTop(rect.top), left: rightLeft }

    const left = clampLeft(isOwnMessage ? rect.right - MESSAGE_MENU_WIDTH : rect.left)
    const fitsBelow = rect.bottom + MESSAGE_MENU_GAP + menuHeight <= viewport.bottom - VIEWPORT_MARGIN
    const fitsAbove = rect.top - MESSAGE_MENU_GAP - menuHeight >= viewport.top + VIEWPORT_MARGIN
    const top = fitsBelow
        ? rect.bottom + MESSAGE_MENU_GAP
        : fitsAbove
            ? rect.top - menuHeight - MESSAGE_MENU_GAP
            : clampTop(rect.top)

    return { top, left }
}

function useGeoChatMessageMenu({ messages, currentProfileId, messagesContainerRef, onError }: Options) {
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

    const clearLongPress = useCallback(() => {
        if (longPressTimerRef.current === null) return
        window.clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
    }, [])

    const setMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
        if (element) messageRefs.current.set(messageId, element)
        else messageRefs.current.delete(messageId)
    }, [])

    const openMessageMenu = useCallback((messageId: string, anchor?: HTMLElement) => {
        if (openMenuId === messageId) {
            closeMessageMenu()
            return
        }

        const message = messages.find((item) => item.id === messageId)
        const element = anchor ?? messageRefs.current.get(messageId)

        if (!message || !element) return

        setMenuPosition(getMenuPosition(element, message.userId === currentProfileId))
        setOpenMenuId(messageId)
    }, [closeMessageMenu, currentProfileId, messages, openMenuId])

    const startLongPress = useCallback((messageId: string) => {
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
    }, [clearLongPress, currentProfileId, messages])

    const scrollToMessage = useCallback((messageId: string) => {
        const element = messageRefs.current.get(messageId)
        const container = messagesContainerRef.current

        if (!element || !container) {
            onError("Исходное сообщение пока не загружено")
            return
        }

        closeMessageMenu()

        const elementRect = element.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const targetTop = container.scrollTop + elementRect.top - containerRect.top - container.clientHeight / 2 + elementRect.height / 2

        container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" })
        setHighlightedMessageId(messageId)

        if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current)

        highlightTimerRef.current = window.setTimeout(() => {
            setHighlightedMessageId(null)
            highlightTimerRef.current = null
        }, 1600)
    }, [closeMessageMenu, messagesContainerRef, onError])

    const handleCopy = useCallback(async (message: GeoChatMessage) => {
        closeMessageMenu()

        try {
            await navigator.clipboard.writeText(message.content)
        } catch (error) {
            console.error("GEO CHAT COPY ERROR:", error)
            onError("Не удалось скопировать сообщение")
        }
    }, [closeMessageMenu, onError])

    useEffect(() => {
        return () => {
            clearLongPress()

            if (highlightTimerRef.current !== null) {
                window.clearTimeout(highlightTimerRef.current)
            }
        }
    }, [clearLongPress])

    useEffect(() => {
        if (!openMenuId) return

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node

            if (!messageMenuRef.current?.contains(target)) {
                closeMessageMenu()
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMessageMenu()
        }

        const handleViewportChange = () => closeMessageMenu()
        const viewport = window.visualViewport

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        window.addEventListener("resize", handleViewportChange)
        window.addEventListener("orientationchange", handleViewportChange)
        viewport?.addEventListener("resize", handleViewportChange)
        viewport?.addEventListener("scroll", handleViewportChange)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("resize", handleViewportChange)
            window.removeEventListener("orientationchange", handleViewportChange)
            viewport?.removeEventListener("resize", handleViewportChange)
            viewport?.removeEventListener("scroll", handleViewportChange)
        }
    }, [closeMessageMenu, openMenuId])

    useEffect(() => {
        if (openMenuId && !messages.some((message) => message.id === openMenuId)) {
            closeMessageMenu()
        }
    }, [closeMessageMenu, messages, openMenuId])

    const openMenuMessage = openMenuId
        ? messages.find((message) => message.id === openMenuId) ?? null
        : null

    return {
        openMenuMessage,
        menuPosition,
        messageMenuRef,
        highlightedMessageId,
        closeMessageMenu,
        openMessageMenu,
        clearLongPress,
        startLongPress,
        setMessageRef,
        scrollToMessage,
        handleCopy
    }
}

export default useGeoChatMessageMenu