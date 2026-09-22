import { createClient } from "@/lib/supabase/server"
import { mapDirectRoom } from "./directMessageMappers"
import type { DirectConversation } from "@/types/directMessages"

export async function loadDirectConversation(
    conversationId: string
): Promise<DirectConversation | null> {
    const supabase =
        await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "get_direct_conversation_web_v1",
        {
            p_conversation_id:
                conversationId
        }
    )

    if (error) {
        console.error(
            "DIRECT CONVERSATION LOAD ERROR:",
            error
        )

        return null
    }

    const row = data?.[0]

    return row
        ? mapDirectRoom(row)
        : null
}