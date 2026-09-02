"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"

export type RadarProfileOption = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

export async function searchRadarProfiles(query: string): Promise<RadarProfileOption[]> {
    const normalizedQuery = query.trim().replace(/^@/, "")

    if (normalizedQuery.length < 2) return []

    const user = await getCurrentUser()

    if (!user) return []

    const supabase = await createClient()

    const [usernameResult, displayNameResult] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").ilike("username", `%${normalizedQuery}%`).limit(10),
        supabase.from("profiles").select("id,username,display_name,avatar_url").ilike("display_name", `%${normalizedQuery}%`).limit(10)
    ])

    if (usernameResult.error) {
        console.error("RADAR USERNAME SEARCH ERROR:", usernameResult.error)
    }

    if (displayNameResult.error) {
        console.error("RADAR DISPLAY NAME SEARCH ERROR:", displayNameResult.error)
    }

    const profiles = [...(usernameResult.data ?? []), ...(displayNameResult.data ?? [])]
    const uniqueProfiles = new Map<string, RadarProfileOption>()

    for (const profile of profiles) {
        uniqueProfiles.set(profile.id, profile)
    }

    return Array.from(uniqueProfiles.values()).slice(0, 10)
}