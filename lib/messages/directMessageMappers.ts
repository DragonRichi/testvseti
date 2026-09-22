import type {
    DirectConversation,
    DirectConversationSummary,
    DirectMessage
} from "@/types/directMessages"

type ConversationRow = {
    id: string
    other_user_id: string
    username: string
    display_name: string
    avatar_url: string | null
    last_message: string | null
    last_message_time: string | null
    last_message_user_id: string | null
    unread_count: number | null
    is_pinned: boolean | null
    is_archived: boolean | null
    is_muted: boolean | null
}

type RoomRow = {
    id: string
    other_user_id: string
    username: string
    display_name: string
    avatar_url: string | null
    is_muted: boolean | null
}

export type DirectMessageRow = {
    id: string
    conversation_id: string
    user_id: string
    content: string | null
    reply_to_id: string | null
    forwarded_from_message_id: string | null
    is_edited: boolean | null
    edited_at: string | null
    delivered_at: string | null
    created_at: string
    author_username: string
    author_display_name: string
    author_avatar_url: string | null
    reply_user_id: string | null
    reply_content: string | null
    reply_author_username: string | null
    reply_author_display_name: string | null
}

export function mapDirectConversation(
    row: ConversationRow
): DirectConversationSummary {
    return {
        id: row.id,
        otherUserId: row.other_user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        lastMessage: row.last_message,
        lastMessageTime:
            row.last_message_time,
        lastMessageUserId:
            row.last_message_user_id,
        unreadCount:
            row.unread_count ?? 0,
        isPinned:
            Boolean(row.is_pinned),
        isArchived:
            Boolean(row.is_archived),
        isMuted:
            Boolean(row.is_muted)
    }
}

export function mapDirectRoom(
    row: RoomRow
): DirectConversation {
    return {
        id: row.id,
        otherUserId:
            row.other_user_id,
        username:
            row.username,
        displayName:
            row.display_name,
        avatarUrl:
            row.avatar_url,
        isMuted:
            Boolean(row.is_muted)
    }
}

export function mapDirectMessage(
    row: DirectMessageRow
): DirectMessage {
    return {
        id: row.id,
        conversationId:
            row.conversation_id,
        userId:
            row.user_id,
        content:
            row.content,
        replyToId:
            row.reply_to_id,
        forwardedFromMessageId:
            row.forwarded_from_message_id,
        isEdited:
            Boolean(row.is_edited),
        editedAt:
            row.edited_at,
        deliveredAt:
            row.delivered_at,
        createdAt:
            row.created_at,
        authorUsername:
            row.author_username,
        authorDisplayName:
            row.author_display_name,
        authorAvatarUrl:
            row.author_avatar_url,

        replyTo:
            row.reply_to_id
                ? {
                    id:
                        row.reply_to_id,
                    userId:
                        row.reply_user_id,
                    content:
                        row.reply_content,
                    authorUsername:
                        row.reply_author_username,
                    authorDisplayName:
                        row.reply_author_display_name
                }
                : null
    }
}