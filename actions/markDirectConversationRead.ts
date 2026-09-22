"use server"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

export async function markDirectConversationRead(
    conversationId: string
) {
    if (!isUuid(conversationId)) {
        return false
    }

    const supabase =
        await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "mark_direct_conversation_read_web_v1",
        {
            p_conversation_id:
                conversationId
        }
    )

    if (error) {
        console.error(
            "MARK DIRECT CONVERSATION READ ERROR:",
            error
        )

        return false
    }

    return Boolean(data)
}