"use server"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

type Result =
    | {
        success: true
        conversationId: string
    }
    | {
        success: false
        error: string
    }

type RpcRow = {
    status: string
    conversation_id: string | null
}

function getError(
    status: string | undefined
) {
    if (status === "self") {
        return "Нельзя написать самому себе"
    }

    if (status === "blocked") {
        return "Переписка с этим пользователем недоступна"
    }

    if (
        status ===
        "user_not_found"
    ) {
        return "Пользователь не найден"
    }

    if (
        status ===
        "unauthorized"
    ) {
        return "Необходимо войти в аккаунт"
    }

    return "Не удалось открыть диалог"
}

export async function startDirectConversation(
    otherUserId: string
): Promise<Result> {
    if (!isUuid(otherUserId)) {
        return {
            success: false,
            error: "Пользователь не найден"
        }
    }

    const supabase =
        await createClient()

    const {
        data,
        error
    } = await supabase.rpc(
        "start_direct_conversation_web_v1",
        {
            p_other_user_id:
                otherUserId
        }
    )

    if (error) {
        console.error(
            "START DIRECT CONVERSATION ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось открыть диалог"
        }
    }

    const row =
        (data as RpcRow[] | null)?.[0]

    if (
        !row ||
        row.status !== "ok" ||
        !row.conversation_id
    ) {
        return {
            success: false,
            error:
                getError(row?.status)
        }
    }

    return {
        success: true,
        conversationId:
            row.conversation_id
    }
}