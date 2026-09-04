export type GeoChatPoint = {
    latitude: number
    longitude: number
}

export type GeoChatRadius = 3000 | 6000 | 9000 | 12000

export type NearbyGeoChat = {
    id: string
    creatorId: string
    name: string
    description: string | null
    radiusM: number
    distanceM: number | null
    creatorUsername: string
    creatorDisplayName: string
    creatorAvatarUrl: string | null
    createdAt: string
}

export type GeoChatRoom = {
    id: string
    creatorId: string
    name: string
    description: string | null
    radiusM: number
    distanceM: number | null
    createdAt: string
}

export type GeoChatMessageReply = {
    id: string
    authorUsername: string
    authorDisplayName: string
    content: string
}

export type GeoChatMessage = {
    id: string
    chatId: string
    userId: string
    content: string
    createdAt: string
    updatedAt: string
    authorUsername: string
    authorDisplayName: string
    authorAvatarUrl: string | null
    replyTo: GeoChatMessageReply | null
}