import "server-only"

import { createHmac } from "crypto"
import { getIpLocation } from "@/lib/geo/getIpLocation"
import { supabaseAdmin } from "@/lib/supabase/admin"

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function createIpHash(ip: string) {
    const secret = process.env.GEO_CACHE_SECRET

    if (!secret) {
        throw new Error("GEO_CACHE_SECRET is not configured")
    }

    return createHmac("sha256", secret).update(ip).digest("hex")
}

export async function getCachedIpLocation(ip: string) {
    const ipHash = createIpHash(ip)
    const minimumUpdatedAt = new Date(Date.now() - CACHE_TTL_MS).toISOString()

    const { data: cachedLocation, error: cacheError } = await supabaseAdmin
        .from("geo_ip_cache")
        .select("city,region,country_code,latitude,longitude,updated_at")
        .eq("ip_hash", ipHash)
        .maybeSingle()

    if (cacheError) {
        console.error("GEO CACHE READ ERROR:", cacheError)
    }

    if (cachedLocation && cachedLocation.updated_at >= minimumUpdatedAt) {
        console.log("GEO CACHE HIT:", cachedLocation.city, cachedLocation.country_code)

        return {
            city: cachedLocation.city,
            region: cachedLocation.region,
            countryCode: cachedLocation.country_code,
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude
        }
    }

    console.log("GEO CACHE MISS")

    const location = await getIpLocation(ip)

    if (!location) {
        if (cachedLocation) {
            console.log("GEO CACHE STALE FALLBACK:", cachedLocation.city, cachedLocation.country_code)

            return {
                city: cachedLocation.city,
                region: cachedLocation.region,
                countryCode: cachedLocation.country_code,
                latitude: cachedLocation.latitude,
                longitude: cachedLocation.longitude
            }
        }

        return null
    }

    const { error: upsertError } = await supabaseAdmin
        .from("geo_ip_cache")
        .upsert(
            {
                ip_hash: ipHash,
                city: location.city,
                region: location.region,
                country_code: location.countryCode,
                latitude: location.latitude,
                longitude: location.longitude,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "ip_hash"
            }
        )

    if (upsertError) {
        console.error("GEO CACHE WRITE ERROR:", upsertError)
    }

    console.log("GEO CACHE SAVED:", location.city, location.countryCode)

    return location
}