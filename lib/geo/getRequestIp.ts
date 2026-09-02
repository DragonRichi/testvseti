import "server-only"

import { headers } from "next/headers"
import { isIP } from "node:net"

function normalizeIp(value: string | null) {
    if (!value) return null

    let ip = value.split(",")[0]?.trim() ?? ""

    if (ip.startsWith("::ffff:")) {
        ip = ip.slice(7)
    }

    if (!isIP(ip)) return null

    if (ip === "127.0.0.1" || ip === "::1") return null
    if (ip.startsWith("10.")) return null
    if (ip.startsWith("192.168.")) return null
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return null

    return ip
}

export async function getRequestIp() {
    const headerStore = await headers()

    const candidates = [
        headerStore.get("cf-connecting-ip"),
        headerStore.get("x-real-ip"),
        headerStore.get("x-forwarded-for")
    ]

    for (const candidate of candidates) {
        const ip = normalizeIp(candidate)

        if (ip) return ip
    }

    return null
}