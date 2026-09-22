"use server"

import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
    }
    | {
        success: false
        error: string
    }

type MessageRow = {
    id: string
}

type AttachmentRow = {
    storage_path: string
}

const PAGE_SIZE = 1000
const MESSAGE_BATCH_SIZE = 100
const STORAGE_BATCH_SIZE = 100

async function getGeoChatStoragePaths(
    chatId: string
) {
    const messageIds: string[] = []

    let from = 0

    while (true) {
        const {
            data,
            error
        } = await supabaseAdmin
            .from("geo_chat_messages")
            .select("id")
            .eq("chat_id", chatId)
            .range(
                from,
                from + PAGE_SIZE - 1
            )

        if (error) {
            console.error(
                "GEO CHAT DELETE MESSAGE IDS ERROR:",
                error
            )

            break
        }

        const rows =
            (data ?? []) as MessageRow[]

        messageIds.push(
            ...rows.map(
                (row) => row.id
            )
        )

        if (
            rows.length <
            PAGE_SIZE
        ) {
            break
        }

        from += PAGE_SIZE
    }

    const paths: string[] = []

    for (
        let index = 0;
        index < messageIds.length;
        index += MESSAGE_BATCH_SIZE
    ) {
        const batch =
            messageIds.slice(
                index,
                index +
                    MESSAGE_BATCH_SIZE
            )

        const {
            data,
            error
        } = await supabaseAdmin
            .from(
                "geo_chat_message_attachments"
            )
            .select("storage_path")
            .in(
                "message_id",
                batch
            )

        if (error) {
            console.error(
                "GEO CHAT DELETE ATTACHMENT PATHS ERROR:",
                error
            )

            continue
        }

        paths.push(
            ...(
                (data ??
                    []) as AttachmentRow[]
            ).map(
                (row) =>
                    row.storage_path
            )
        )
    }

    return paths
}

async function removeStorageFiles(
    paths: string[]
) {
    for (
        let index = 0;
        index < paths.length;
        index += STORAGE_BATCH_SIZE
    ) {
        const batch =
            paths.slice(
                index,
                index +
                    STORAGE_BATCH_SIZE
            )

        const {
            error
        } = await supabaseAdmin
            .storage
            .from("geo-chat-media")
            .remove(batch)

        if (error) {
            console.error(
                "GEO CHAT STORAGE CLEANUP ERROR:",
                error
            )
        }
    }
}

export async function deleteGeoChatRoom(
    chatId: string
): Promise<Result> {
    if (!isUuid(chatId)) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    const supabase =
        await createClient()

    const {
        data: { user },
        error: userError
    } =
        await supabase.auth.getUser()

    if (
        userError ||
        !user
    ) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const {
        data: room,
        error: roomError
    } = await supabaseAdmin
        .from("geo_chats")
        .select("id,creator_id")
        .eq("id", chatId)
        .maybeSingle()

    if (roomError) {
        console.error(
            "GEO CHAT DELETE LOAD ERROR:",
            roomError
        )

        return {
            success: false,
            error: "Не удалось загрузить геочат"
        }
    }

    if (!room) {
        return {
            success: false,
            error: "Геочат не найден"
        }
    }

    const adminMode =
        await hasGeoChatAdminMode()

    if (
        !adminMode &&
        room.creator_id !== user.id
    ) {
        return {
            success: false,
            error: "Недостаточно прав"
        }
    }

    const storagePaths =
        await getGeoChatStoragePaths(
            chatId
        )

    const {
        error: deleteError
    } = await supabaseAdmin
        .from("geo_chats")
        .delete()
        .eq("id", chatId)

    if (deleteError) {
        console.error(
            "GEO CHAT DELETE ERROR:",
            deleteError
        )

        return {
            success: false,
            error: "Не удалось удалить геочат"
        }
    }

    if (
        storagePaths.length > 0
    ) {
        await removeStorageFiles(
            storagePaths
        )
    }

    revalidatePath("/geochats")

    return {
        success: true
    }
}