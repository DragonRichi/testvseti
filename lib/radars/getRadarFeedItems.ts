import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Post, PostComment, PostCommentNode, Profile } from "@/types/social"
import type { RadarFeedItem } from "@/types/radar"

type RawComment = Omit<PostComment, "author">

type Result = {
    items: RadarFeedItem[]
    likedCommentIds: string[]
}

export async function getRadarFeedItems(posts: Post[], currentUserId: string): Promise<Result> {
    if (posts.length === 0) {
        return {
            items: [],
            likedCommentIds: []
        }
    }

    const supabase = await createClient()
    const postIds = posts.map((post) => post.id)

    const [{ data: comments, error: commentsError }, { data: postLikes, error: postLikesError }] = await Promise.all([
        supabase.from("post_comments").select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").in("post_id", postIds).order("created_at", { ascending: true }),
        supabase.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
    ])

    if (commentsError) {
        console.error("RADAR COMMENTS LOAD ERROR:", commentsError)
    }

    if (postLikesError) {
        console.error("RADAR POST LIKES LOAD ERROR:", postLikesError)
    }

    const rawComments = (comments ?? []) as RawComment[]
    const commentIds = rawComments.map((comment) => comment.id)

    const profileIds = Array.from(new Set([
        ...posts.map((post) => post.user_id),
        ...rawComments.map((comment) => comment.user_id)
    ]))

    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", profileIds)

    if (profilesError) {
        console.error("RADAR PROFILES LOAD ERROR:", profilesError)
    }

    let likedCommentIds: string[] = []

    if (commentIds.length > 0) {
        const { data: commentLikes, error: commentLikesError } = await supabase.from("comment_likes").select("comment_id").eq("user_id", currentUserId).in("comment_id", commentIds)

        if (commentLikesError) {
            console.error("RADAR COMMENT LIKES LOAD ERROR:", commentLikesError)
        } else {
            likedCommentIds = (commentLikes ?? []).map((like) => like.comment_id)
        }
    }

    const profilesById = new Map<string, Profile>()

    for (const profile of profiles ?? []) {
        profilesById.set(profile.id, profile)
    }

    const commentMap = new Map<string, PostCommentNode>()

    for (const comment of rawComments) {
        commentMap.set(comment.id, {
            ...comment,
            author: profilesById.get(comment.user_id) ?? null,
            replies: []
        })
    }

    const commentsByPostId: Record<string, PostCommentNode[]> = {}

    for (const comment of rawComments) {
        const node = commentMap.get(comment.id)

        if (!node) continue

        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id)

            if (parent) {
                parent.replies.push(node)
                continue
            }
        }

        if (!commentsByPostId[comment.post_id]) {
            commentsByPostId[comment.post_id] = []
        }

        commentsByPostId[comment.post_id].push(node)
    }

    const likedPostIds = new Set((postLikes ?? []).map((like) => like.post_id))

    const items: RadarFeedItem[] = []

    for (const post of posts) {
        const author = profilesById.get(post.user_id)

        if (!author) continue

        items.push({
            post,
            author,
            initialLiked: likedPostIds.has(post.id),
            initialComments: commentsByPostId[post.id] ?? []
        })
    }

    return {
        items,
        likedCommentIds
    }
}