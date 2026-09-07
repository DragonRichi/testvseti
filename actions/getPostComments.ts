"use server"

import { createClient } from "@/lib/supabase/server"
import type { PostCommentNode } from "@/types/social"

type Result =
    | {
        success: true
        comments: PostCommentNode[]
        likedCommentIds: string[]
        error: null
    }
    | {
        success: false
        comments: []
        likedCommentIds: []
        error: string
    }

export async function getPostComments(postId: string): Promise<Result> {
    if (!postId) {
        return {
            success: false,
            comments: [],
            likedCommentIds: [],
            error: "Публикация не найдена"
        }
    }

    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            comments: [],
            likedCommentIds: [],
            error: "Необходимо войти в аккаунт"
        }
    }

    const { data: commentsData, error: commentsError } = await supabase.from("post_comments").select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").eq("post_id", postId).order("created_at", { ascending: true })

    if (commentsError) {
        console.error("COMMENTS LOAD ERROR:", commentsError)

        return {
            success: false,
            comments: [],
            likedCommentIds: [],
            error: "Не удалось загрузить комментарии"
        }
    }

    if (!commentsData || commentsData.length === 0) {
        return {
            success: true,
            comments: [],
            likedCommentIds: [],
            error: null
        }
    }

    const userIds = [...new Set(commentsData.map((comment) => comment.user_id))]
    const commentIds = commentsData.map((comment) => comment.id)

    const [{ data: profiles, error: profilesError }, { data: likedComments, error: likedCommentsError }] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds),
        supabase.from("comment_likes").select("comment_id").eq("user_id", user.id).in("comment_id", commentIds)
    ])

    if (profilesError) {
        console.error("COMMENT PROFILES LOAD ERROR:", profilesError)

        return {
            success: false,
            comments: [],
            likedCommentIds: [],
            error: "Не удалось загрузить авторов комментариев"
        }
    }

    if (likedCommentsError) {
        console.error("COMMENT LIKES LOAD ERROR:", likedCommentsError)
    }

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const commentMap = new Map<string, PostCommentNode>()
    const rootComments: PostCommentNode[] = []

    for (const comment of commentsData) {
        commentMap.set(comment.id, {
            ...comment,
            author: profileMap.get(comment.user_id) ?? null,
            replies: []
        })
    }

    for (const comment of commentsData) {
        const node = commentMap.get(comment.id)

        if (!node) continue

        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id)

            if (parent) {
                parent.replies.push(node)
                continue
            }
        }

        rootComments.push(node)
    }

    return {
        success: true,
        comments: rootComments,
        likedCommentIds: (likedComments ?? []).map((like) => like.comment_id),
        error: null
    }
}