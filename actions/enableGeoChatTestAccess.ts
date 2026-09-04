"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
        expiresAt: string
    }
    | {
        success: false
        error: string
    }

export async function enableGeoChatTestAccess(password: string): Promise<Result> {
    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    if (password !== "1234") {
        return {
            success: false,
            error: "Неверный пароль"
        }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabaseAdmin
        .from("geo_chat_test_access")
        .upsert(
            {
                user_id: user.id,
                expires_at: expiresAt
            },
            {
                onConflict: "user_id"
            }
        )

    if (error) {
        console.error("GEO CHAT TEST ACCESS ERROR:", error)

        return {
            success: false,
            error: "Не удалось включить тестовый доступ"
        }
    }

    revalidatePath("/geochats")

    return {
        success: true,
        expiresAt
    }
}