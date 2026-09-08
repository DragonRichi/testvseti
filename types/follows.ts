export type ProfileConnectionType = "followers" | "following"

export type ProfileConnectionCursor = {
    createdAt: string
    id: string
}

export type ProfileConnectionItem = {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isFollowing: boolean
    isCurrentUser: boolean
}
