"use server"

import { getCachedIpLocation } from "@/lib/geo/getCachedIpLocation"
import { getIpLocation } from "@/lib/geo/getIpLocation"
import { getRequestIp } from "@/lib/geo/getRequestIp"
import { createClient } from "@/lib/supabase/server"

type Result = {
    success: boolean
    city?: string
    countryCode?: string
    error?: string
}

export async function syncUserLocation(): Promise<Result> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Пользователь не авторизован"
        }
    }

    const { data: existingLocation, error: existingLocationError } = await supabase.from("user_locations").select("user_id").eq("user_id", user.id).maybeSingle()

    if (existingLocationError) {
        console.error("USER LOCATION LOAD ERROR:", existingLocationError)

        return {
            success: false,
            error: "Не удалось проверить геолокацию"
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

    const location = `POINT(${geo.longitude} ${geo.latitude})`
    const updatedAt = new Date().toISOString()

    if (existingLocation) {
        const { error } = await supabase.from("user_locations").update({
            location,
            city: geo.city,
            region: geo.region,
            country_code: geo.countryCode,
            source: "ip",
            updated_at: updatedAt
        }).eq("user_id", user.id)

        if (error) {
            console.error("USER LOCATION UPDATE ERROR:", error)

            return {
                success: false,
                error: "Не удалось обновить геолокацию"
            }
        }
    } else {
        const { error } = await supabase.from("user_locations").insert({
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

    console.log("USER GEO SYNC:", geo.city, geo.region, geo.countryCode)

    return {
        success: true,
        city: geo.city,
        countryCode: geo.countryCode
    }
}