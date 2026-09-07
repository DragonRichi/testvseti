"use server"

import { createGeoChatAdminToken, GEO_CHAT_ADMIN_COOKIE_NAME } from "@/lib/geochats/geoChatAdminMode"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

type Result =
    | {
        success: true
    }
    | {
        success: false
        error: string
    }

const TEMPORARY_ADMIN_PASSWORD = "1234"

export async function enableGeoChatAdminMode(password: string): Promise<Result> {
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

    if (password !== TEMPORARY_ADMIN_PASSWORD) {
        return {
            success: false,
            error: "Неверный пароль"
        }
    }

    const cookieStore = await cookies()

    cookieStore.set(GEO_CHAT_ADMIN_COOKIE_NAME, createGeoChatAdminToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 4
    })

    return {
        success: true
    }
}

export async function disableGeoChatAdminMode(): Promise<Result> {
    const cookieStore = await cookies()

    cookieStore.delete(GEO_CHAT_ADMIN_COOKIE_NAME)

    return {
        success: true
    }
}