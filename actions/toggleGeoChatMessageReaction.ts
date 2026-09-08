"use server"

import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessageReaction } from "@/types/geoChatReactions"

type ToggleRow = {
    status: string
    active: boolean
}

type ReactionRow = {
    message_id: string
    emoji: string
    reaction_count: number | string
    reacted_by_me: boolean | null
}

type Result =
    | {
        success: true
        active: boolean
        reactions: GeoChatMessageReaction[]
    }
    | {
        success: false
        error: string
    }

function getErrorMessage(status: string) {
    if (status === "unauthorized") return "Необходимо войти в аккаунт"
    if (status === "message_not_found") return "Сообщение не найдено"
    if (status === "forbidden") return "Нет доступа к этому геочату"
    if (status === "invalid_emoji") return "Некорректная реакция"

    return "Не удалось изменить реакцию"
}

export async function toggleGeoChatMessageReaction(
    messageId: string,
    emoji: string
): Promise<Result> {
    const normalizedMessageId =
        typeof messageId === "string"
            ? messageId.trim()
            : ""

    const normalizedEmoji =
        typeof emoji === "string"
            ? emoji.trim()
            : ""

    if (!normalizedMessageId) {
        return {
            success: false,
            error: "Сообщение не найдено"
        }
    }

    if (!normalizedEmoji || normalizedEmoji.length > 16) {
        return {
            success: false,
            error: "Некорректная реакция"
        }
    }

    const supabase = await createClient()

    const { data: toggleData, error: toggleError } =
        await supabase.rpc(
            "toggle_geo_chat_message_reaction",
            {
                p_message_id: normalizedMessageId,
                p_emoji: normalizedEmoji
            }
        )

    if (toggleError) {
        console.error(
            "GEO CHAT REACTION TOGGLE ERROR:",
            toggleError
        )

        return {
            success: false,
            error: "Не удалось изменить реакцию"
        }
    }

    const toggleRows = (toggleData ?? []) as ToggleRow[]
    const toggleResult = toggleRows[0]

    if (!toggleResult || toggleResult.status !== "ok") {
        return {
            success: false,
            error: getErrorMessage(
                toggleResult?.status ?? ""
            )
        }
    }

    const { data: reactionData, error: reactionError } =
        await supabase.rpc(
            "get_geo_chat_message_reactions",
            {
                p_message_ids: [
                    normalizedMessageId
                ]
            }
        )

    if (reactionError) {
        console.error(
            "GEO CHAT REACTIONS RELOAD ERROR:",
            reactionError
        )

        return {
            success: false,
            error: "Реакция изменена, но не удалось обновить список"
        }
    }

    const rows = (reactionData ?? []) as ReactionRow[]

    return {
        success: true,
        active: Boolean(toggleResult.active),
        reactions: rows.map((row) => ({
            messageId: row.message_id,
            emoji: row.emoji,
            count: Number(row.reaction_count) || 0,
            reactedByMe: Boolean(row.reacted_by_me)
        }))
    }
}