import type { Post, Profile } from "@/types/social"

export type ProfileTab =
    | "posts"
    | "replies"
    | "media"
    | "reposts"

export type ProfilePostMode =
    | "posts"
    | "media"

export type ProfilePostsCursor = {
    createdAt: string
    id: string
}

export type ProfileRepliesCursor = {
    createdAt: string
    id: string
}

export type ProfileReplyItem = {
    id: string
    postId: string
    parentId: string | null
    content: string
    createdAt: string
    updatedAt: string
    post: Post
    postAuthor: Profile | null
}