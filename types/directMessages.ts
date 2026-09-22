export type DirectConversationSummary = {
    id: string
    otherUserId: string
    username: string
    displayName: string
    avatarUrl: string | null
    lastMessage: string | null
    lastMessageTime: string | null
    lastMessageUserId: string | null
    unreadCount: number
    isPinned: boolean
    isArchived: boolean
    isMuted: boolean
}

export type DirectConversation = {
    id: string
    otherUserId: string
    username: string
    displayName: string
    avatarUrl: string | null
    isMuted: boolean
}

export type DirectMessageReply = {
    id: string
    userId: string | null
    content: string | null
    authorUsername: string | null
    authorDisplayName: string | null
}

export type DirectMessage = {
    id: string
    conversationId: string
    userId: string
    content: string | null
    replyToId: string | null
    forwardedFromMessageId: string | null
    isEdited: boolean
    editedAt: string | null
    deliveredAt: string | null
    createdAt: string
    authorUsername: string
    authorDisplayName: string
    authorAvatarUrl: string | null
    replyTo: DirectMessageReply | null
}