"use server"
import { createClient } from "@/lib/supabase/server"

type Props = {
    postId: string
}

export async function getPostComments({ postId }: Props) {
    try {
        const supabase = await createClient()
        const { data: comments, error } = await supabase.from("post_comments").select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").eq("post_id", postId).is("parent_id", null).order("created_at", { ascending: true })

        if (error) {
            console.error("COMMENTS LOAD ERROR: ", error)

            return {
                success: false,
                error: "Не удалось загрузить комментарии",
                comments: []
            }
        }

        if (!comments || comments.length === 0) {
            return {
                success: true,
                error: null,
                comments: []
            }
        }

        const userIds = [...new Set(comments.map((comment) => comment.user_id))]

        const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds)

        if (profilesError) {
            console.error("COMMENT PROFILES LOAD ERROR: ", profilesError)
            return {
                success: false,
                error: "Не удалось загрузить авторов комментариев",
                comments: []
            }
        }

        const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

        const result = comments.map((comment) => ({
            ...comment,
            author: profileMap.get(comment.user_id) ?? null
        }))

        return {
            success: true,
            error: null,
            comments: result
        }
    } catch (error) {
        console.error("COMMENTS LOAD ERROR:", error)

        return {
            success: false,
            error: "Ошибка загрузки комментариев",
            comments: []
        }
    }
}