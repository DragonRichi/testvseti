"use client"

import type { GeoChatAccessStatus } from "@/components/GeoChat/GeoChatAccessWarning"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import type { Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useCallback, useEffect, useRef } from "react"
import GeoChatAccessWarning from "./GeoChatAccessWarning"
import GeoChatComposer from "./GeoChatComposer"
import GeoChatDeleteDialog from "./GeoChatDeleteDialog"
import GeoChatHeader from "./GeoChatHeader"
import GeoChatMessages from "./GeoChatMessages"

import useGeoChatLiveAccess from "./useGeoChatLiveAccess"
import useGeoChatMessageActions from "./useGeoChatMessageActions"
import useGeoChatPullRefresh from "./useGeoChatPullRefresh"
import useGeoChatRealtime from "./useGeoChatRealtime"
import useGeoChatAdminRoomMode from "./useGeoChatAdminRootMode"

type Props = {
    room: GeoChatRoomType
    initialMessages: GeoChatMessage[]
    currentProfile: Profile
    initialAdminMode: boolean
}

type AccessProps = {
    accessStatus: GeoChatAccessStatus
    accessError: string | null
    accuracy: number | null
    isTestAccess: boolean
    canSend: boolean
    isAdminMode: boolean
}

function GeoChatRoomLoading() {
    return (
        <div className="flex h-[calc(100dvh-32px)] min-h-[520] items-center justify-center rounded-3xl border border-green-100 bg-white">
            <div className="flex flex-col items-center text-center">
                <LoaderCircle className="size-6 animate-spin text-main-green" />
                <div className="mt-3 text-sm text-main-gray">Проверяем доступ...</div>
            </div>
        </div>
    )
}

function GeoChatRoomWithLiveAccess(props: Props) {
    const access = useGeoChatLiveAccess(props.room.id)

    return <GeoChatRoomContent {...props} accessStatus={access.status} accessError={access.error} accuracy={access.accuracy} isTestAccess={access.isTestAccess} canSend={access.canSend} isAdminMode={false} />
}

function GeoChatRoomContent({ room, initialMessages, currentProfile, accessStatus, accessError, accuracy, isTestAccess, canSend, isAdminMode }: Props & AccessProps) {
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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

        return container.scrollHeight - container.scrollTop - container.clientHeight < 160
    }, [])

    const { messages, setMessages } = useGeoChatRealtime({
        roomId: room.id,
        initialMessages,
        isNearBottom,
        scrollToBottom
    })

    const actions = useGeoChatMessageActions({
        room,
        currentProfile,
        messages,
        setMessages,
        canSend,
        isAdminMode,
        scrollToBottom
    })

    const { isRefreshing, pullDistance, refreshReady, isPulling, handleTouchStart, handleTouchMove, handleTouchEnd } = useGeoChatPullRefresh({
        roomId: room.id,
        messagesContainerRef,
        setMessages,
        setError: actions.setError
    })

    useEffect(() => {
        scrollToBottom("instant")
    }, [scrollToBottom])

    return (
        <>
            <div className="fixed inset-x-0 bottom-0 top-[64] z-40 flex flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-[calc(100dvh-32px)] lg:min-h-[520] lg:rounded-3xl lg:border lg:border-green-100">
                <GeoChatHeader room={room} accuracy={accuracy} isTestAccess={isTestAccess} isAdminMode={isAdminMode} />

                <GeoChatMessages messages={messages} currentProfileId={currentProfile.id} canSend={canSend} isRefreshing={isRefreshing} pullDistance={pullDistance} refreshReady={refreshReady} isPulling={isPulling} messagesContainerRef={messagesContainerRef} messagesEndRef={messagesEndRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onReply={actions.handleReplyToMessage} onEdit={actions.handleEditMessage} onDelete={actions.handleDeleteRequest} onError={actions.setError} />

                {!isAdminMode && <GeoChatAccessWarning status={accessStatus} error={accessError} />}

                <GeoChatComposer content={actions.content} error={actions.error} isPending={actions.isPending} canSend={canSend} accessStatus={accessStatus} editingMessage={actions.editingMessage} replyingTo={actions.replyingTo} textareaRef={actions.textareaRef} onContentChange={(value) => { actions.setContent(value); actions.setError("") }} onSubmit={() => void actions.handleSubmit()} onCancelEdit={actions.cancelEdit} onCancelReply={() => actions.setReplyingTo(null)} onFocus={() => { if (!actions.editingMessage) scrollToBottom() }} />
            </div>

            <GeoChatDeleteDialog target={actions.deleteTarget} isDeleting={actions.isDeleting} onClose={() => { if (!actions.isDeleting) actions.setDeleteTarget(null) }} onConfirm={() => void actions.handleDeleteConfirm()} />
        </>
    )
}

function GeoChatRoom(props: Props) {
    const { isAdminMode, isChecking } = useGeoChatAdminRoomMode(props.initialAdminMode)

    if (isChecking) {
        return <GeoChatRoomLoading />
    }

    if (isAdminMode) {
        return <GeoChatRoomContent {...props} accessStatus="active" accessError={null} accuracy={null} isTestAccess={false} canSend isAdminMode />
    }

    return <GeoChatRoomWithLiveAccess {...props} />
}

export default GeoChatRoom