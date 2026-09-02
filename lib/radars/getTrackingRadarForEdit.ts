import "server-only"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"

export type TrackingRadarForEdit = {
    id: string
    name: string
    sort_mode: "nearest" | "latest" | "popular" | "discussed"
    radius_m: 3000 | 6000 | 9000 | 12000
    radar_lat: number
    radar_lon: number
}

export async function getTrackingRadarForEdit(radarId: string): Promise<TrackingRadarForEdit | null> {
    const user = await getCurrentUser()

    if (!user) return null

    const supabase = await createClient()

    const { data: radar, error } = await supabase.from("radars").select("id,name,type,sort_mode,radius_m,radar_lat,radar_lon").eq("id", radarId).eq("user_id", user.id).maybeSingle()

    if (error) {
        console.error("TRACKING RADAR EDIT LOAD ERROR:", error)
        return null
    }

    if (!radar || radar.type !== "tracking" || !radar.radius_m || radar.radar_lat === null || radar.radar_lon === null) {
        return null
    }

    const radiusM = radar.radius_m as 3000 | 6000 | 9000 | 12000
    const sortMode = radar.sort_mode === "nearest" || radar.sort_mode === "popular" || radar.sort_mode === "discussed" ? radar.sort_mode : "latest"

    return {
        id: radar.id,
        name: radar.name,
        sort_mode: sortMode,
        radius_m: radiusM,
        radar_lat: radar.radar_lat,
        radar_lon: radar.radar_lon
    }
}