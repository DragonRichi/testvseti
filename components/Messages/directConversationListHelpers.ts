import type { DirectConversationSummary } from "@/types/directMessages"

export type DirectMessageInsertPayload = {
    new: {
        conversation_id?: unknown
        user_id?: unknown
        content?: unknown
        created_at?: unknown
    }
}

export function formatConversationTime(
    value: string | null
) {
    if (!value) return ""

    const date = new Date(value)
    const now = new Date()

    const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()

    return new Intl.DateTimeFormat(
        "ru-RU",
        sameDay
            ? {
                hour: "2-digit",
                minute: "2-digit"
            }
            : {
                day: "2-digit",
                month: "2-digit"
            }
    ).format(date)
}

export function applyInsertedMessageToConversations(
    current: DirectConversationSummary[],
    payload: DirectMessageInsertPayload,
    currentProfileId: string
) {
    const row = payload.new

    const conversationId =
        typeof row.conversation_id === "string"
            ? row.conversation_id
            : null

    const userId =
        typeof row.user_id === "string"
            ? row.user_id
            : null

    const content =
        typeof row.content === "string"
            ? row.content
            : null

    const createdAt =
        typeof row.created_at === "string"
            ? row.created_at
            : null

    if (!conversationId || !createdAt) {
        return {
            conversations: current,
            found: false
        }
    }

    const existing =
        current.find(
            (conversation) =>
                conversation.id === conversationId
        )

    if (!existing) {
        return {
            conversations: current,
            found: false
        }
    }

    const updated: DirectConversationSummary = {
        ...existing,
        lastMessage: content,
        lastMessageTime: createdAt,
        lastMessageUserId: userId,
        unreadCount:
            userId &&
                userId !== currentProfileId
                ? existing.unreadCount + 1
                : existing.unreadCount
    }

    const remaining =
        current.filter(
            (conversation) =>
                conversation.id !== conversationId
        )

    const pinned =
        remaining.filter(
            (conversation) =>
                conversation.isPinned
        )

    const normal =
        remaining.filter(
            (conversation) =>
                !conversation.isPinned
        )

    return {
        found: true,
        conversations: updated.isPinned
            ? [
                updated,
                ...pinned,
                ...normal
            ]
            : [
                ...pinned,
                updated,
                ...normal
            ]
    }
}