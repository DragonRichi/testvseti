"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { supabaseAdmin } from "@/lib/supabase/admin"

type Props = {
    latitude: number
    longitude: number
}

type NominatimAddress = {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    region?: string
    country?: string
    country_code?: string
}

type NominatimResponse = {
    name?: string
    display_name?: string
    address?: NominatimAddress
}

type CachedRow = {
    name: string
    city: string | null
    region: string | null
    country_code: string | null
    expires_at: string
}

type RateLimitRow = {
    acquired: boolean
    wait_ms: number
}

type Result =
    | {
        success: true
        name: string
        city: string | null
        region: string | null
        countryCode: string | null
    }
    | {
        success: false
        error: string
    }

const PROVIDER = "nominatim"
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000
const RATE_LIMIT_INTERVAL_MS = 1100
const MAX_RATE_LIMIT_WAIT_MS = 5000

function getCoordinateKey(latitude: number, longitude: number) {
    return `${latitude.toFixed(5)},${longitude.toFixed(5)}`
}

function sleep(milliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds)
    })
}

async function getCachedResult(coordinateKey: string): Promise<Result | null> {
    const { data, error } = await supabaseAdmin
        .from("reverse_geocode_cache")
        .select("name,city,region,country_code,expires_at")
        .eq("provider", PROVIDER)
        .eq("coordinate_key", coordinateKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle()

    if (error) {
        console.error("REVERSE GEOCODE CACHE LOAD ERROR:", error)
        return null
    }

    const row = data as CachedRow | null

    if (!row) return null

    return {
        success: true,
        name: row.name,
        city: row.city,
        region: row.region,
        countryCode: row.country_code
    }
}

async function acquireRateLimitSlot(coordinateKey: string) {
    const startedAt = Date.now()

    while (Date.now() - startedAt < MAX_RATE_LIMIT_WAIT_MS) {
        const cachedResult = await getCachedResult(coordinateKey)

        if (cachedResult) {
            return {
                cachedResult,
                acquired: false
            }
        }

        const { data, error } = await supabaseAdmin.rpc("try_acquire_external_api_slot", {
            p_service: PROVIDER,
            p_interval_ms: RATE_LIMIT_INTERVAL_MS
        })

        if (error) {
            console.error("REVERSE GEOCODE RATE LIMIT ERROR:", error)

            return {
                cachedResult: null,
                acquired: false
            }
        }

        const row = ((data ?? []) as RateLimitRow[])[0]

        if (!row) {
            return {
                cachedResult: null,
                acquired: false
            }
        }

        if (row.acquired) {
            return {
                cachedResult: null,
                acquired: true
            }
        }

        const waitMs = Math.max(50, Math.min(row.wait_ms + 50, 1500))

        if (Date.now() - startedAt + waitMs >= MAX_RATE_LIMIT_WAIT_MS) break

        await sleep(waitMs)
    }

    return {
        cachedResult: null,
        acquired: false
    }
}

export async function reverseGeocodePoint({ latitude, longitude }: Props): Promise<Result> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return {
            success: false,
            error: "Некорректная широта"
        }
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return {
            success: false,
            error: "Некорректная долгота"
        }
    }

    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const coordinateKey = getCoordinateKey(latitude, longitude)
    const cachedResult = await getCachedResult(coordinateKey)

    if (cachedResult) return cachedResult

    const slot = await acquireRateLimitSlot(coordinateKey)

    if (slot.cachedResult) return slot.cachedResult

    if (!slot.acquired) {
        return {
            success: false,
            error: "Сервис определения места временно занят. Попробуйте ещё раз"
        }
    }

    try {
        const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
            addressdetails: "1",
            zoom: "18",
            "accept-language": "en"
        })

        const baseUrl = process.env.NOMINATIM_BASE_URL?.trim() || "https://nominatim.openstreetmap.org"
        const userAgent = process.env.NOMINATIM_USER_AGENT?.trim() || "vseti.by/1.0 (+https://vseti.by)"

        const response = await fetch(`${baseUrl}/reverse?${params.toString()}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
            headers: {
                Accept: "application/json",
                "User-Agent": userAgent
            }
        })

        if (!response.ok) {
            console.error("REVERSE GEOCODE HTTP ERROR:", response.status)

            return {
                success: false,
                error: "Не удалось определить место"
            }
        }

        const data = await response.json() as NominatimResponse
        const address = data.address ?? {}

        const city = address.city ?? address.town ?? address.village ?? address.municipality ?? null
        const region = address.state ?? address.region ?? address.county ?? null
        const countryCode = address.country_code?.toUpperCase() ?? null
        const name = data.name?.trim() || city || data.display_name?.split(",")[0]?.trim() || ""

        if (!name) {
            return {
                success: false,
                error: "Не удалось определить название места"
            }
        }

        const { error: cacheError } = await supabaseAdmin.from("reverse_geocode_cache").upsert({
            provider: PROVIDER,
            coordinate_key: coordinateKey,
            name,
            city,
            region,
            country_code: countryCode,
            expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: "provider,coordinate_key"
        })

        if (cacheError) {
            console.error("REVERSE GEOCODE CACHE SAVE ERROR:", cacheError)
        }

        return {
            success: true,
            name,
            city,
            region,
            countryCode
        }
    } catch (error) {
        console.error("REVERSE GEOCODE ERROR:", error)

        return {
            success: false,
            error: "Не удалось определить место"
        }
    }
}