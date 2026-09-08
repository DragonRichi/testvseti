import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { PagedPostComment } from "@/types/postComments"
import type { PostComment, Profile } from "@/types/social"

export const POST_COMMENT_SELECT = "id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at"

export type RawPostComment = Omit<PostComment, "author">

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

type ReplyCountRow = {
    comment_id: string
    reply_count: number | string | null
}

const AUTO_LOAD_REPLIES_COUNT = 3
const MAX_AUTO_REPLY_DEPTH = 3

export async function loadPagedCommentItems(
    supabase: ServerSupabaseClient,
    currentUserId: string,
    rawComments: RawPostComment[],
    currentDepth = 0
): Promise<PagedPostComment[]> {
    if (rawComments.length === 0) return []

    const commentIds = rawComments.map((comment) => comment.id)

    const userIds = Array.from(
        new Set(
            rawComments.map((comment) => comment.user_id)
        )
    )

    const [
        { data: profiles, error: profilesError },
        { data: likedComments, error: likedCommentsError },
        { data: replyCounts, error: replyCountsError }
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .in("id", userIds),

        supabase
            .from("comment_likes")
            .select("comment_id")
            .eq("user_id", currentUserId)
            .in("comment_id", commentIds),

        supabase.rpc("get_comment_reply_counts", {
            p_comment_ids: commentIds
        })
    ])

    if (profilesError) {
        console.error(
            "COMMENT PROFILES LOAD ERROR:",
            profilesError
        )

        throw new Error(
            "Не удалось загрузить авторов комментариев"
        )
    }

    if (likedCommentsError) {
        console.error(
            "COMMENT LIKES LOAD ERROR:",
            likedCommentsError
        )
    }

    if (replyCountsError) {
        console.error(
            "COMMENT REPLY COUNTS LOAD ERROR:",
            replyCountsError
        )

        throw new Error(
            "Не удалось загрузить количество ответов"
        )
    }

    const profilesById = new Map<string, Profile>()

    for (const profile of profiles ?? []) {
        profilesById.set(
            profile.id,
            profile as Profile
        )
    }

    const likedIds = new Set(
        (likedComments ?? []).map(
            (item) => item.comment_id
        )
    )

    const replyCountsById = new Map<string, number>()

    for (const row of (replyCounts ?? []) as ReplyCountRow[]) {
        replyCountsById.set(
            row.comment_id,
            Math.max(
                0,
                Number(row.reply_count ?? 0)
            )
        )
    }

    const comments: PagedPostComment[] =
        rawComments.map((comment) => {
            const replyCount =
                replyCountsById.get(comment.id) ?? 0

            return {
                ...comment,
                author:
                    profilesById.get(comment.user_id) ??
                    null,
                replies: [],
                replyCount,
                repliesLoaded: replyCount === 0,
                initialLiked: likedIds.has(comment.id)
            }
        })

    if (currentDepth >= MAX_AUTO_REPLY_DEPTH) {
        return comments
    }

    const smallParentIds = comments
        .filter(
            (comment) =>
                comment.replyCount > 0 &&
                comment.replyCount <=
                    AUTO_LOAD_REPLIES_COUNT
        )
        .map((comment) => comment.id)

    if (smallParentIds.length === 0) {
        return comments
    }

    const postId = rawComments[0]?.post_id

    if (!postId) return comments

    const {
        data: smallReplies,
        error: smallRepliesError
    } = await supabase
        .from("post_comments")
        .select(POST_COMMENT_SELECT)
        .eq("post_id", postId)
        .in("parent_id", smallParentIds)
        .order("created_at", {
            ascending: true
        })
        .order("id", {
            ascending: true
        })

    if (smallRepliesError) {
        console.error(
            "SMALL COMMENT REPLIES LOAD ERROR:",
            smallRepliesError
        )

        return comments
    }

    const hydratedReplies =
        await loadPagedCommentItems(
            supabase,
            currentUserId,
            (smallReplies ?? []) as RawPostComment[],
            currentDepth + 1
        )

    const repliesByParentId =
        new Map<string, PagedPostComment[]>()

    for (const reply of hydratedReplies) {
        if (!reply.parent_id) continue

        const currentReplies =
            repliesByParentId.get(
                reply.parent_id
            ) ?? []

        currentReplies.push(reply)

        repliesByParentId.set(
            reply.parent_id,
            currentReplies
        )
    }

    for (const comment of comments) {
        if (
            comment.replyCount > 0 &&
            comment.replyCount <=
                AUTO_LOAD_REPLIES_COUNT
        ) {
            comment.replies =
                repliesByParentId.get(
                    comment.id
                ) ?? []

            comment.repliesLoaded = true
        }
    }

    return comments
}