"use server"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import {
    mapDirectMessage,
    type DirectMessageRow
} from "@/lib/messages/directMessageMappers"
import type { DirectMessage } from "@/types/directMessages"

const PAGE_SIZE = 20

type Result =
    | {
        success: true
        messages: DirectMessage[]
        hasMore: boolean
    }
    | {
        success: false
        error: string
    }

export async function getOlderDirectMessages(
    conversationId: string,
    beforeCreatedAt: string,
    beforeId: string
): Promise<Result> {
    if (
        !isUuid(conversationId) ||
        !isUuid(beforeId) ||
        Number.isNaN(
            Date.parse(
                beforeCreatedAt
            )
        )
    ) {
        return {
            success: false,
            error: "Некорректный курсор сообщений"
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
            p_limit:
                PAGE_SIZE + 1,
            p_before_created_at:
                beforeCreatedAt,
            p_before_id:
                beforeId
        }
    )

    if (error) {
        console.error(
            "OLDER DIRECT MESSAGES ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось загрузить предыдущие сообщения"
        }
    }

    const rows =
        (data ??
            []) as DirectMessageRow[]

    const hasMore =
        rows.length >
        PAGE_SIZE

    const visibleRows =
        hasMore
            ? rows.slice(
                -PAGE_SIZE
            )
            : rows

    return {
        success: true,
        messages:
            visibleRows.map(
                mapDirectMessage
            ),
        hasMore
    }
}