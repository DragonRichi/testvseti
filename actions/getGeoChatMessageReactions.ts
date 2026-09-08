"use server"

import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessageReaction } from "@/types/geoChatReactions"

type ReactionRow = {
    message_id: string
    emoji: string
    reaction_count: number | string
    reacted_by_me: boolean | null
}

type Result =
    | {
        success: true
        reactions: GeoChatMessageReaction[]
    }
    | {
        success: false
        error: string
    }

export async function getGeoChatMessageReactions(
    messageIds: string[]
): Promise<Result> {
    const normalizedIds = Array.from(
        new Set(
            messageIds
                .filter(
                    (id): id is string =>
                        typeof id === "string"
                )
                .map((id) => id.trim())
                .filter(Boolean)
        )
    )

    if (normalizedIds.length === 0) {
        return {
            success: true,
            reactions: []
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
        "get_geo_chat_message_reactions",
        {
            p_message_ids: normalizedIds
        }
    )

    if (error) {
        console.error(
            "GEO CHAT REACTIONS LOAD ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось загрузить реакции"
        }
    }

    const rows = (data ?? []) as ReactionRow[]

    return {
        success: true,
        reactions: rows.map((row) => ({
            messageId: row.message_id,
            emoji: row.emoji,
            count: Number(row.reaction_count) || 0,
            reactedByMe: Boolean(row.reacted_by_me)
        }))
    }
}