import "server-only"

import { createHmac } from "crypto"
import { getIpInfoLocation } from "@/lib/geo/getIpInfoLocation"
import { getIpLocation } from "@/lib/geo/getIpLocation"
import { supabaseAdmin } from "@/lib/supabase/admin"

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

type GeoLocation = {
    city: string
    region: string
    countryCode: string
    latitude: number
    longitude: number
}

function createIpHash(ip: string) {
    const secret = process.env.GEO_CACHE_SECRET

    if (!secret) {
        throw new Error("GEO_CACHE_SECRET is not configured")
    }

    return createHmac("sha256", secret).update(ip).digest("hex")
}

export async function getCachedIpLocation(ip: string): Promise<GeoLocation | null> {
    const ipHash = createIpHash(ip)

    const { data: cachedLocation, error: cacheError } = await supabaseAdmin
        .from("geo_ip_cache")
        .select("city,region,country_code,latitude,longitude,updated_at")
        .eq("ip_hash", ipHash)
        .maybeSingle()

    if (cacheError) {
        console.error("GEO CACHE READ ERROR:", cacheError)
    }

    if (cachedLocation) {
        const cacheAge = Date.now() - new Date(cachedLocation.updated_at).getTime()

        if (cacheAge < CACHE_TTL_MS) {
            console.log("GEO CACHE HIT:", cachedLocation.city, cachedLocation.country_code)

            return {
                city: cachedLocation.city,
                region: cachedLocation.region,
                countryCode: cachedLocation.country_code,
                latitude: cachedLocation.latitude,
                longitude: cachedLocation.longitude
            }
        }
    }

    console.log("GEO CACHE MISS")

    // let location = await getIpLocation(ip)
    // let provider = "ipwho.is"

    const forceIpInfo = process.env.GEO_FORCE_IPINFO === "true"

    let location = forceIpInfo ? null : await getIpLocation(ip)
    let provider = "ipwho.is"

    if (!location) {
        console.log("GEO PRIMARY FAILED, TRYING IPINFO")

        location = await getIpInfoLocation(ip)
        provider = "ipinfo"
    }

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

        console.error("GEO ALL PROVIDERS FAILED")
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

    console.log("GEO CACHE SAVED:", provider, location.city, location.countryCode)

    return location
}