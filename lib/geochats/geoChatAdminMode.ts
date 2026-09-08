import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const GEO_CHAT_ADMIN_COOKIE_NAME = "vseti_geo_chat_admin"

const TOKEN_VERSION = "v2"

type SessionIdentity = {
    userId: string
    sessionId: string
}

function getSecret() {
    const secret = process.env.GEO_CHAT_ADMIN_SECRET ?? process.env.GEO_CACHE_SECRET

    if (!secret) {
        throw new Error("GEO_CHAT_ADMIN_SECRET or GEO_CACHE_SECRET is not configured")
    }

    return secret
}

function createSignature(payload: string) {
    return createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function safeEqualHex(left: string, right: string) {
    if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false

    const leftBuffer = Buffer.from(left, "hex")
    const rightBuffer = Buffer.from(right, "hex")

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

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

export function createGeoChatAdminToken(userId: string, sessionId: string, expiresAtMs: number) {
    const payload = `${TOKEN_VERSION}.${userId}.${sessionId}.${expiresAtMs}`
    return `${payload}.${createSignature(payload)}`
}

function parseGeoChatAdminToken(value: string) {
    const parts = value.split(".")

    if (parts.length !== 5) return null

    const [version, userId, sessionId, expiresAtRaw, signature] = parts
    const expiresAtMs = Number(expiresAtRaw)

    if (version !== TOKEN_VERSION || !userId || !sessionId || !Number.isSafeInteger(expiresAtMs)) return null

    const payload = `${version}.${userId}.${sessionId}.${expiresAtRaw}`
    const expectedSignature = createSignature(payload)

    if (!safeEqualHex(signature, expectedSignature)) return null

    return { userId, sessionId, expiresAtMs }
}

export async function hasGeoChatAdminMode() {
    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(GEO_CHAT_ADMIN_COOKIE_NAME)?.value

    if (!cookieValue) return false

    const token = parseGeoChatAdminToken(cookieValue)

    if (!token || token.expiresAtMs <= Date.now()) return false

    const identity = await getSessionIdentity()

    if (!identity || identity.userId !== token.userId || identity.sessionId !== token.sessionId) return false

    const { data: adminSession, error } = await supabaseAdmin
        .from("geo_chat_admin_sessions")
        .select("session_id")
        .eq("session_id", identity.sessionId)
        .eq("user_id", identity.userId)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle()

    if (error) {
        console.error("GEO CHAT ADMIN SESSION CHECK ERROR:", error)
        return false
    }

    return Boolean(adminSession)
}
