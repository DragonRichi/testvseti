"use server"

import { createClient } from "@/lib/supabase/server"

export type DirectMessageSearchMatch = {
    conversationId: string
    messageId: string
    messageUserId: string
    content: string
    createdAt: string
}

type SearchRow = {
    conversation_id: string
    message_id: string
    message_user_id: string
    message_content: string
    message_created_at: string
}

export async function searchDirectMessages(
    query: string
): Promise<DirectMessageSearchMatch[]> {
    const normalizedQuery = query.trim()

    if (
        normalizedQuery.length < 2 ||
        normalizedQuery.length > 200
    ) {
        return []
    }

    const supabase = await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "search_direct_messages_web_v1",
        {
            p_query: normalizedQuery,
            p_limit: 50
        }
    )

    if (error) {
        console.error(
            "DIRECT MESSAGE SEARCH ERROR:",
            error
        )

        return []
    }

    return (
        (data ?? []) as SearchRow[]
    ).map((row) => ({
        conversationId:
            row.conversation_id,
        messageId:
            row.message_id,
        messageUserId:
            row.message_user_id,
        content:
            row.message_content,
        createdAt:
            row.message_created_at
    }))
}