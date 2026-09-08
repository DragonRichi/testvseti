export type GeoChatMessageReaction = {
    messageId: string
    emoji: string
    count: number
    reactedByMe: boolean
}

export type GeoChatMessageReactionMap = Record<string, GeoChatMessageReaction[]>