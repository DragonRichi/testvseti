"use server"

import { createClient } from "@/lib/supabase/server"

type Result =
    | {
        success: true
        canAccess: boolean
        testAccess: boolean
    }
    | {
        success: false
        error: string
    }

export async function getGeoChatAccessState(chatId: string): Promise<Result> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const { data: testAccess, error: testAccessError } = await supabase.rpc("has_geo_chat_test_access")

    if (testAccessError) {
        console.error("GEO CHAT TEST ACCESS CHECK ERROR:", testAccessError)

        return {
            success: false,
            error: "Не удалось проверить доступ к геочату"
        }
    }

    if (testAccess) {
        return {
            success: true,
            canAccess: true,
            testAccess: true
        }
    }

    const { data: canAccess, error: accessError } = await supabase.rpc("can_access_geo_chat", {
        p_chat_id: chatId
    })

    if (accessError) {
        console.error("GEO CHAT ACCESS CHECK ERROR:", accessError)

        return {
            success: false,
            error: "Не удалось проверить доступ к геочату"
        }
    }

    return {
        success: true,
        canAccess: Boolean(canAccess),
        testAccess: false
    }
}