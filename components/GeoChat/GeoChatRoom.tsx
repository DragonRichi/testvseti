"use client"

import type { GeoChatAccessStatus } from "@/components/GeoChat/GeoChatAccessWarning"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import type { GeoChatMessageAttachmentMap } from "@/types/geoChatAttachments"
import type { Profile } from "@/types/social"
import { useCallback, useEffect, useMemo, useRef } from "react"
import GeoChatAccessWarning from "./GeoChatAccessWarning"
import GeoChatComposer from "./GeoChatComposer"
import GeoChatDeleteDialog from "./GeoChatDeleteDialog"
import GeoChatHeader from "./GeoChatHeader"
import GeoChatMessages from "./GeoChatMessages"
import useGeoChatBottomPin from "./useGeoChatBottomPin"
import useGeoChatLiveAccess from "./useGeoChatLiveAccess"
import useGeoChatMessageActions from "./useGeoChatMessageActions"
import useGeoChatMessageAttachments from "./useGeoChatMessageAttachments"
import useGeoChatOlderMessages from "./useGeoChatOlderMessages"
import useGeoChatPullRefresh from "./useGeoChatPullRefresh"
import useGeoChatRealtime from "./useGeoChatRealtime"
import useGeoChatVisualViewport from "./useGeoChatVisualViewport"

type Props = {
    room: GeoChatRoomType
    initialMessages: GeoChatMessage[]
    initialAttachments: GeoChatMessageAttachmentMap
    initialHasMore: boolean
    currentProfile: Profile
    initialAdminMode: boolean
}

type AccessProps = {
    accessStatus: GeoChatAccessStatus
    accessError: string | null
    accuracy: number | null
    canSend: boolean
    isAdminMode: boolean
}

function GeoChatRoomWithLiveAccess(props: Props) {
    const access = useGeoChatLiveAccess(props.room.id)

    return (
        <GeoChatRoomContent
            {...props}
            accessStatus={access.status}
            accessError={access.error}
            accuracy={access.accuracy}
            canSend={access.canSend}
            isAdminMode={false}
        />
    )
}

function GeoChatRoomContent({
    room,
    initialMessages,
    initialAttachments,
    initialHasMore,
    currentProfile,
    accessStatus,
    accessError,
    accuracy,
    canSend,
    isAdminMode
}: Props & AccessProps) {
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const mobileViewportStyle = useGeoChatVisualViewport()

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
            const container = messagesContainerRef.current

            if (!container) {
                return
            }

            container.scrollTo({
                top: container.scrollHeight,
                behavior
            })
        })
    }, [])

    const isNearBottom = useCallback(() => {
        const container = messagesContainerRef.current

        if (!container) {
            return true
        }

        return (
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
            160
        )
    }, [])

    const { messages, setMessages } = useGeoChatRealtime({
        roomId: room.id,
        initialMessages,
        isNearBottom,
        scrollToBottom
    })

    const messageIds = useMemo(
        () => messages.map((message) => message.id),
        [messages]
    )

    const {
        attachments: attachmentsByMessage,
        setMessageAttachments
    } = useGeoChatMessageAttachments({
        roomId: room.id,
        messageIds,
        initialAttachments
    })

    useGeoChatBottomPin({
        roomId: room.id,
        messageCount: messages.length,
        messagesContainerRef,
        messagesEndRef
    })

    const actions = useGeoChatMessageActions({
        room,
        currentProfile,
        messages,
        setMessages,
        setMessageAttachments,
        canSend,
        isAdminMode,
        scrollToBottom
    })

    useGeoChatOlderMessages({
        roomId: room.id,
        messages,
        setMessages,
        initialHasMore,
        messagesContainerRef,
        setError: actions.setError
    })

    const {
        isRefreshing,
        pullDistance,
        refreshReady,
        isPulling,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    } = useGeoChatPullRefresh({
        roomId: room.id,
        messagesContainerRef,
        setMessages,
        setError: actions.setError
    })

    return (
        <>
            <div
                style={mobileViewportStyle}
                className="fixed inset-x-0 bottom-0 top-[64] z-40 flex flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-[calc(100dvh-32px)] lg:min-h-[520] lg:rounded-3xl lg:border lg:border-green-100"
            >
                <GeoChatHeader
                    room={room}
                    accuracy={accuracy}
                    isAdminMode={isAdminMode}
                    currentProfileId={currentProfile.id}
                />

                <GeoChatMessages
                    messages={messages}
                    attachmentsByMessage={attachmentsByMessage}
                    currentProfileId={currentProfile.id}
                    canSend={canSend}
                    isRefreshing={isRefreshing}
                    pullDistance={pullDistance}
                    refreshReady={refreshReady}
                    isPulling={isPulling}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onReply={actions.handleReplyToMessage}
                    onEdit={actions.handleEditMessage}
                    onDelete={actions.handleDeleteRequest}
                    onError={actions.setError}
                />

                {!isAdminMode && (
                    <GeoChatAccessWarning
                        status={accessStatus}
                        error={accessError}
                    />
                )}

                <GeoChatComposer
                    content={actions.content}
                    error={actions.error}
                    isPending={actions.isPending}
                    canSend={canSend}
                    accessStatus={accessStatus}
                    editingMessage={actions.editingMessage}
                    replyingTo={actions.replyingTo}
                    textareaRef={actions.textareaRef}
                    onContentChange={(value) => {
                        actions.setContent(value)
                        actions.setError("")
                    }}
                    onSubmit={actions.handleSubmit}
                    onCancelEdit={actions.cancelEdit}
                    onCancelReply={() => actions.setReplyingTo(null)}
                    onFocus={() => {
                        if (!actions.editingMessage) {
                            scrollToBottom("auto")
                        }
                    }}
                    onError={actions.setError}
                />
            </div>

            <GeoChatDeleteDialog
                target={actions.deleteTarget}
                isDeleting={actions.isDeleting}
                onClose={() => {
                    if (!actions.isDeleting) {
                        actions.setDeleteTarget(null)
                    }
                }}
                onConfirm={() => void actions.handleDeleteConfirm()}
            />
        </>
    )
}

function GeoChatRoom(props: Props) {
    if (props.initialAdminMode) {
        return (
            <GeoChatRoomContent
                {...props}
                accessStatus="active"
                accessError={null}
                accuracy={null}
                canSend
                isAdminMode
            />
        )
    }

    return <GeoChatRoomWithLiveAccess {...props} />
}

export default GeoChatRoom