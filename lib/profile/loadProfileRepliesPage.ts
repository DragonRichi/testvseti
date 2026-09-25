import "server-only"

import type { ProfileRepliesCursor, ProfileReplyItem } from "@/types/profileContent"
import type { Post, Profile } from "@/types/social"
import type { SupabaseClient } from "@supabase/supabase-js"

const PAGE_SIZE = 15

const POST_SELECT =
    "id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code,tagged_location_name,tagged_lat,tagged_lon,tagged_city,tagged_region,tagged_country_code"

type Props = {
    supabase: SupabaseClient
    profileId: string
    cursor?: ProfileRepliesCursor | null
}

type CommentRow = {
    id: string
    post_id: string
    user_id: string
    parent_id: string | null
    content: string
    created_at: string
    updated_at: string
}

export async function loadProfileRepliesPage({
    supabase,
    profileId,
    cursor = null
}: Props) {
    let query = supabase
        .from("post_comments")
        .select(
            "id,post_id,user_id,parent_id,content,created_at,updated_at"
        )
        .eq(
            "user_id",
            profileId
        )

    if (cursor) {
        query = query.or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
        )
    }

    const {
        data,
        error
    } = await query
        .order(
            "created_at",
            { ascending: false }
        )
        .order(
            "id",
            { ascending: false }
        )
        .limit(
            PAGE_SIZE + 1
        )

    if (error) {
        throw error
    }

    const fetchedComments =
        (data ?? []) as CommentRow[]

    const hasMore =
        fetchedComments.length >
        PAGE_SIZE

    const comments =
        fetchedComments.slice(
            0,
            PAGE_SIZE
        )

    const postIds = [
        ...new Set(
            comments.map(
                (comment) =>
                    comment.post_id
            )
        )
    ]

    if (postIds.length === 0) {
        return {
            items: [] as ProfileReplyItem[],
            nextCursor: null
        }
    }

    const {
        data: postRows,
        error: postsError
    } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .in(
            "id",
            postIds
        )

    if (postsError) {
        throw postsError
    }

    const posts =
        (postRows ?? []) as Post[]

    const postMap =
        new Map(
            posts.map(
                (post) => [
                    post.id,
                    post
                ]
            )
        )

    const authorIds = [
        ...new Set(
            posts.map(
                (post) =>
                    post.user_id
            )
        )
    ]

    let authors: Profile[] = []

    if (authorIds.length > 0) {
        const {
            data: authorRows,
            error: authorsError
        } = await supabase
            .from("profiles")
            .select(
                "id,username,display_name,avatar_url"
            )
            .in(
                "id",
                authorIds
            )

        if (authorsError) {
            console.error(
                "PROFILE REPLIES AUTHORS ERROR:",
                authorsError
            )
        } else {
            authors =
                (authorRows ?? []) as Profile[]
        }
    }

    const authorMap =
        new Map(
            authors.map(
                (author) => [
                    author.id,
                    author
                ]
            )
        )

    const items =
        comments.flatMap(
            (
                comment
            ): ProfileReplyItem[] => {
                const post =
                    postMap.get(
                        comment.post_id
                    )

                if (!post) {
                    return []
                }

                return [
                    {
                        id:
                            comment.id,
                        postId:
                            comment.post_id,
                        parentId:
                            comment.parent_id,
                        content:
                            comment.content,
                        createdAt:
                            comment.created_at,
                        updatedAt:
                            comment.updated_at,
                        post,
                        postAuthor:
                            authorMap.get(
                                post.user_id
                            ) ??
                            null
                    }
                ]
            }
        )

    const lastComment =
        comments.at(-1)

    const nextCursor:
        ProfileRepliesCursor | null =
        hasMore &&
        lastComment
            ? {
                createdAt:
                    lastComment.created_at,
                id:
                    lastComment.id
            }
            : null

    return {
        items,
        nextCursor
    }
}