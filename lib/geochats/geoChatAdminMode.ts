import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const GEO_CHAT_ADMIN_COOKIE_NAME = "vseti_geo_chat_admin"

const COOKIE_PAYLOAD = "vseti-geo-chat-admin-v1"

function getSecret() {
    const secret = process.env.GEO_CACHE_SECRET

    if (!secret) {
        throw new Error("GEO_CACHE_SECRET is not configured")
    }

    return secret
}

export function createGeoChatAdminToken() {
    return createHmac("sha256", getSecret()).update(COOKIE_PAYLOAD).digest("hex")
}

export async function hasGeoChatAdminMode() {
    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(GEO_CHAT_ADMIN_COOKIE_NAME)?.value

    if (!cookieValue) return false

    const expectedValue = createGeoChatAdminToken()

    const receivedBuffer = Buffer.from(cookieValue)
    const expectedBuffer = Buffer.from(expectedValue)

    if (receivedBuffer.length !== expectedBuffer.length) return false

    return timingSafeEqual(receivedBuffer, expectedBuffer)
}