import type { Post, PostCommentNode, Profile } from "@/types/social"

export type Radar = {
    id: string
    user_id: string
    type: "publications" | "tracking"
    name: string
    sort_mode: string | null
}

export type RadarFeedCursor = {
    id: string
    createdAt: string | null
    score: number | null
}

export type RadarFeedItem = {
    post: Post
    author: Profile
    initialLiked: boolean
    initialComments: PostCommentNode[]
}