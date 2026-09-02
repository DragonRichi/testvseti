import "server-only"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import type { RadarProfileOption } from "@/actions/searchRadarProfiles"

export type PublicationsRadarForEdit = {
    id: string
    name: string
    sort_mode: "latest" | "popular" | "discussed"
    profiles: RadarProfileOption[]
}

export async function getPublicationsRadarForEdit(radarId: string): Promise<PublicationsRadarForEdit | null> {
    const user = await getCurrentUser()

    if (!user) return null

    const supabase = await createClient()

    const { data: radar, error: radarError } = await supabase.from("radars").select("id,name,type,sort_mode").eq("id", radarId).eq("user_id", user.id).maybeSingle()

    if (radarError || !radar || radar.type !== "publications") {
        if (radarError) console.error("RADAR EDIT LOAD ERROR:", radarError)
        return null
    }

    const { data: sources, error: sourcesError } = await supabase.from("radar_sources").select("source_id").eq("radar_id", radar.id).eq("source_type", "user")

    if (sourcesError) {
        console.error("RADAR EDIT SOURCES ERROR:", sourcesError)
        return null
    }

    const profileIds = (sources ?? []).map((source) => source.source_id)

    let profiles: RadarProfileOption[] = []

    if (profileIds.length > 0) {
        const { data, error } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", profileIds)

        if (error) {
            console.error("RADAR EDIT PROFILES ERROR:", error)
            return null
        }

        profiles = data ?? []
    }

    return {
        id: radar.id,
        name: radar.name,
        sort_mode: radar.sort_mode === "popular" || radar.sort_mode === "discussed" ? radar.sort_mode : "latest",
        profiles
    }
}