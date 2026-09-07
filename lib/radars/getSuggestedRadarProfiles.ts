import "server-only"

import type { RadarProfileOption } from "@/actions/searchRadarProfiles"
import { createClient } from "@/lib/supabase/server"

export async function getSuggestedRadarProfiles(userId: string): Promise<RadarProfileOption[]> {
    const supabase = await createClient()

    const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id,created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

    if (followsError) {
        console.error("RADAR FOLLOWING LOAD ERROR:", followsError)
        return []
    }

    const profileIds = (follows ?? []).map((follow) => follow.following_id)

    if (profileIds.length === 0) return []

    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", profileIds)

    if (profilesError) {
        console.error("RADAR SUGGESTED PROFILES ERROR:", profilesError)
        return []
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

    return profileIds.flatMap((profileId) => {
        const profile = profilesById.get(profileId)

        if (!profile) return []

        return [{
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name ?? profile.username,
            avatar_url: profile.avatar_url
        }]
    })
}