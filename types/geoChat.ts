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
    distanceM: number
    creatorUsername: string
    creatorDisplayName: string
    creatorAvatarUrl: string | null
    createdAt: string
}