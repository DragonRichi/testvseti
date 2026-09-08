"use server"

import { getCachedIpLocation } from "@/lib/geo/getCachedIpLocation"
import { getIpLocation } from "@/lib/geo/getIpLocation"
import { getRequestIp } from "@/lib/geo/getRequestIp"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { supabaseAdmin } from "@/lib/supabase/admin"

const MIN_SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000

type Result =
    | {
        success: true
        city: string
        region: string
        countryCode: string
        changed: boolean
        skipped: boolean
    }
    | {
        success: false
        error: string
    }

type ExistingLocation = {
    user_id: string
    city: string | null
    region: string | null
    country_code: string | null
    updated_at: string | null
}

export async function syncUserLocation(): Promise<Result> {
    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Пользователь не авторизован"
        }
    }

    const { data, error: existingLocationError } = await supabaseAdmin
        .from("user_locations")
        .select("user_id,city,region,country_code,updated_at")
        .eq("user_id", user.id)
        .maybeSingle()

    if (existingLocationError) {
        console.error("USER LOCATION LOAD ERROR:", existingLocationError)

        return {
            success: false,
            error: "Не удалось проверить геолокацию"
        }
    }

    const existingLocation = data as ExistingLocation | null

    if (existingLocation?.updated_at) {
        const updatedAt = new Date(existingLocation.updated_at).getTime()

        if (Number.isFinite(updatedAt) && Date.now() - updatedAt < MIN_SYNC_INTERVAL_MS) {
            return {
                success: true,
                city: existingLocation.city ?? "",
                region: existingLocation.region ?? "",
                countryCode: existingLocation.country_code ?? "",
                changed: false,
                skipped: true
            }
        }
    }

    const ip = await getRequestIp()

    const geo = ip
        ? await getCachedIpLocation(ip)
        : process.env.NODE_ENV === "development"
            ? await getIpLocation(null)
            : null

    if (!geo) {
        return {
            success: false,
            error: "Не удалось определить геолокацию"
        }
    }

    const changed = !existingLocation ||
        existingLocation.city !== geo.city ||
        existingLocation.region !== geo.region ||
        existingLocation.country_code !== geo.countryCode

    const location = `POINT(${geo.longitude} ${geo.latitude})`
    const updatedAt = new Date().toISOString()

    if (existingLocation) {
        const { error } = await supabaseAdmin
            .from("user_locations")
            .update({
                location,
                city: geo.city,
                region: geo.region,
                country_code: geo.countryCode,
                source: "ip",
                updated_at: updatedAt
            })
            .eq("user_id", user.id)

        if (error) {
            console.error("USER LOCATION UPDATE ERROR:", error)

            return {
                success: false,
                error: "Не удалось обновить геолокацию"
            }
        }
    } else {
        const { error } = await supabaseAdmin
            .from("user_locations")
            .insert({
                user_id: user.id,
                location,
                city: geo.city,
                region: geo.region,
                country_code: geo.countryCode,
                source: "ip",
                shares_location: false,
                updated_at: updatedAt
            })

        if (error) {
            console.error("USER LOCATION INSERT ERROR:", error)

            return {
                success: false,
                error: "Не удалось сохранить геолокацию"
            }
        }
    }

    if (process.env.NODE_ENV === "development") {
        console.log("USER GEO SYNC:", geo.city, geo.region, geo.countryCode, changed ? "CHANGED" : "UNCHANGED")
    }

    return {
        success: true,
        city: geo.city,
        region: geo.region,
        countryCode: geo.countryCode,
        changed,
        skipped: false
    }
}
