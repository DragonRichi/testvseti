"use server"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import {
    mapDirectMessage,
    type DirectMessageRow
} from "@/lib/messages/directMessageMappers"
import type { DirectMessage } from "@/types/directMessages"

type Result =
    | {
        success: true
        messages: DirectMessage[]
    }
    | {
        success: false
        error: string
    }

export async function getDirectMessages(
    conversationId: string
): Promise<Result> {
    if (!isUuid(conversationId)) {
        return {
            success: false,
            error: "Диалог не найден"
        }
    }

    const supabase =
        await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "get_direct_messages_page_web_v1",
        {
            p_conversation_id:
                conversationId,
            p_limit: 40,
            p_before_created_at:
                null,
            p_before_id:
                null
        }
    )

    if (error) {
        console.error(
            "DIRECT MESSAGES SYNC ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось обновить сообщения"
        }
    }

    return {
        success: true,
        messages:
            (
                (data ??
                    []) as DirectMessageRow[]
            ).map(
                mapDirectMessage
            )
    }
}