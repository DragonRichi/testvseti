import type { Post, PostCommentNode, Profile } from "@/types/social"

export type GeoFeedPointCursor = {
    id: string
    createdAt: string | null
}

export type GeoFeedCursor = {
    city: GeoFeedPointCursor | null
    region: GeoFeedPointCursor | null
    country: GeoFeedPointCursor | null
    priority: GeoFeedPointCursor | null
    world: GeoFeedPointCursor | null
}

export type GeoFeedItem = {
    post: Post
    author: Profile
    initialLiked: boolean
    initialComments: PostCommentNode[]
}