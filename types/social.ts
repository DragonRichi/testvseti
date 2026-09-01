export type Profile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

export type Post = {
    id: string
    user_id: string
    content: string | null
    media_urls: string[] | null
    comment_count: number | null
    like_count: number | null
    view_count: number | null
    share_count: number | null
    created_at: string | null
    visibility: string | null
}

export type CommentAuthor = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

export type PostComment = {
    id: string
    post_id: string
    user_id: string
    parent_id: string | null
    content: string
    media_url: string | null
    likes_count: number
    created_at: string
    updated_at: string
    author: CommentAuthor | null
}

export type CommentsByPostId = Record<string, PostComment[]>