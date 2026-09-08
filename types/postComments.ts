import type { PostCommentNode } from "@/types/social"

export type CommentCursor = {
    createdAt: string
    id: string
}

export type PagedPostComment = Omit<PostCommentNode, "replies"> & {
    replies: PagedPostComment[]
    replyCount: number
    repliesLoaded: boolean
    initialLiked: boolean
}