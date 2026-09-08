"use server"

import { createGeoChatAdminToken, GEO_CHAT_ADMIN_COOKIE_NAME } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

type Result =
    | { success: true }
    | { success: false; error: string }

type SessionIdentity = {
    userId: string
    sessionId: string
}

const TEMPORARY_ADMIN_PASSWORD = "1234"
const ADMIN_MODE_TTL_SECONDS = 60 * 60 * 4
const ADMIN_MODE_TTL_MS = ADMIN_MODE_TTL_SECONDS * 1000

async function getSessionIdentity(): Promise<SessionIdentity | null> {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()

    if (error || !data?.claims) return null

    const claims = data.claims as Record<string, unknown>
    const userId = typeof claims.sub === "string" ? claims.sub : null
    const sessionId = typeof claims.session_id === "string" ? claims.session_id : null

    if (!userId || !sessionId) return null

    return { userId, sessionId }
}

export async function enableGeoChatAdminMode(password: string): Promise<Result> {
    const identity = await getSessionIdentity()

    if (!identity) {
        return { success: false, error: "Необходимо войти в аккаунт" }
    }

    if (password !== TEMPORARY_ADMIN_PASSWORD) {
        return { success: false, error: "Неверный пароль" }
    }

    const expiresAtMs = Date.now() + ADMIN_MODE_TTL_MS
    const expiresAt = new Date(expiresAtMs).toISOString()

    const { error: adminSessionError } = await supabaseAdmin
        .from("geo_chat_admin_sessions")
        .upsert(
            {
                session_id: identity.sessionId,
                user_id: identity.userId,
                expires_at: expiresAt
            },
            { onConflict: "session_id" }
        )

    if (adminSessionError) {
        console.error("GEO CHAT ADMIN SESSION CREATE ERROR:", adminSessionError)
        return { success: false, error: "Не удалось включить режим администратора" }
    }

    const cookieStore = await cookies()
    const token = createGeoChatAdminToken(identity.userId, identity.sessionId, expiresAtMs)

    cookieStore.set(GEO_CHAT_ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_MODE_TTL_SECONDS
    })

    return { success: true }
}

export async function disableGeoChatAdminMode(): Promise<Result> {
    const identity = await getSessionIdentity()

    if (identity) {
        const { error: adminSessionError } = await supabaseAdmin
            .from("geo_chat_admin_sessions")
            .delete()
            .eq("session_id", identity.sessionId)
            .eq("user_id", identity.userId)

        if (adminSessionError) {
            console.error("GEO CHAT ADMIN SESSION DELETE ERROR:", adminSessionError)
            return { success: false, error: "Не удалось выключить режим администратора" }
        }
    }

    const cookieStore = await cookies()
    cookieStore.delete(GEO_CHAT_ADMIN_COOKIE_NAME)

    return { success: true }
}
