import { createClient } from "@/lib/supabase/server"
import {
    mapDirectMessage,
    type DirectMessageRow
} from "./directMessageMappers"
import type { DirectMessage } from "@/types/directMessages"

const INITIAL_MESSAGES = 40

export type DirectMessagesPage = {
    messages: DirectMessage[]
    hasMore: boolean
}

export async function loadDirectMessages(
    conversationId: string
): Promise<DirectMessagesPage> {
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
            p_limit:
                INITIAL_MESSAGES + 1,
            p_before_created_at:
                null,
            p_before_id:
                null
        }
    )

    if (error) {
        console.error(
            "DIRECT MESSAGES LOAD ERROR:",
            error
        )

        return {
            messages: [],
            hasMore: false
        }
    }

    const rows =
        (data ??
            []) as DirectMessageRow[]

    const hasMore =
        rows.length >
        INITIAL_MESSAGES

    const visibleRows =
        hasMore
            ? rows.slice(
                -INITIAL_MESSAGES
            )
            : rows

    return {
        messages:
            visibleRows.map(
                mapDirectMessage
            ),
        hasMore
    }
}