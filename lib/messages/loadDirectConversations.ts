import { createClient } from "@/lib/supabase/server"
import { mapDirectConversation } from "./directMessageMappers"
import type { DirectConversationSummary } from "@/types/directMessages"

export async function loadDirectConversations(): Promise<DirectConversationSummary[]> {
    const supabase =
        await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "get_direct_conversations_web_v1"
    )

    if (error) {
        console.error(
            "DIRECT CONVERSATIONS LOAD ERROR:",
            error
        )

        return []
    }

    return (data ?? []).map(
        mapDirectConversation
    )
}