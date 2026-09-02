import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { RadarProfileOption } from "@/actions/searchRadarProfiles"

export async function getSuggestedRadarProfiles(userId: string): Promise<RadarProfileOption[]> {
    const supabase = await createClient()

    const { data: connections, error: connectionsError } = await supabase.from("connections").select("user_id,connection_id").or(`user_id.eq.${userId},connection_id.eq.${userId}`)

    if (connectionsError) {
        console.error("RADAR CONTACTS LOAD ERROR:", connectionsError)
        return []
    }

    const profileIds = Array.from(new Set((connections ?? []).map((connection) => connection.user_id === userId ? connection.connection_id : connection.user_id).filter((id) => id !== userId)))

    if (profileIds.length === 0) return []

    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", profileIds).limit(20)

    if (profilesError) {
        console.error("RADAR SUGGESTED PROFILES ERROR:", profilesError)
        return []
    }

    return profiles ?? []
}