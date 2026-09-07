import type { SupabaseClient } from "@supabase/supabase-js"
import type { GeoChatMessage, GeoChatSenderRole } from "@/types/geoChat"

export type RealtimeGeoChatMessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    reply_to_id: string | null
    sender_role: GeoChatSenderRole | null
    created_at: string
    updated_at: string
}

export async function loadRealtimeGeoChatMessage(supabase: SupabaseClient, row: RealtimeGeoChatMessageRow): Promise<GeoChatMessage | null> {
    const { data: author, error: authorError } = await supabase.from("profiles").select("username,display_name,avatar_url").eq("id", row.user_id).maybeSingle()

    if (authorError || !author) {
        console.error("GEO CHAT REALTIME AUTHOR ERROR:", authorError)
        return null
    }

    let replyTo: GeoChatMessage["replyTo"] = null

    if (row.reply_to_id) {
        const { data: replyMessage, error: replyError } = await supabase.from("geo_chat_messages").select("id,user_id,content").eq("id", row.reply_to_id).maybeSingle()

        if (replyError) {
            console.error("GEO CHAT REALTIME REPLY ERROR:", replyError)
            return null
        }

        if (replyMessage) {
            const { data: replyAuthor, error: replyAuthorError } = await supabase.from("profiles").select("username,display_name").eq("id", replyMessage.user_id).maybeSingle()

            if (replyAuthorError) {
                console.error("GEO CHAT REALTIME REPLY AUTHOR ERROR:", replyAuthorError)
                return null
            }

            if (replyAuthor) {
                replyTo = {
                    id: replyMessage.id,
                    authorUsername: replyAuthor.username,
                    authorDisplayName: replyAuthor.display_name ?? replyAuthor.username,
                    content: replyMessage.content
                }
            }
        }
    }

    return {
        id: row.id,
        chatId: row.chat_id,
        userId: row.user_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorUsername: author.username,
        authorDisplayName: author.display_name ?? author.username,
        authorAvatarUrl: author.avatar_url,
        replyTo,
        senderRole: row.sender_role ?? null
    }
}