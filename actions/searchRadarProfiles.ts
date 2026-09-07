"use server"

import { createClient } from "@/lib/supabase/server"

export type RadarProfileOption = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

export async function searchRadarProfiles(query: string): Promise<RadarProfileOption[]> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) return []

    const normalizedQuery = query.trim()

    if (normalizedQuery.length < 2) return []

    const [{ data: usernameProfiles, error: usernameError }, { data: displayNameProfiles, error: displayNameError }] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").ilike("username", `%${normalizedQuery}%`).limit(20),
        supabase.from("profiles").select("id,username,display_name,avatar_url").ilike("display_name", `%${normalizedQuery}%`).limit(20)
    ])

    if (usernameError || displayNameError) {
        console.error("RADAR PROFILE SEARCH ERROR:", usernameError ?? displayNameError)
        return []
    }

    const uniqueProfiles = new Map<string, RadarProfileOption>()

    for (const profile of [...(usernameProfiles ?? []), ...(displayNameProfiles ?? [])]) {
        uniqueProfiles.set(profile.id, {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name ?? profile.username,
            avatar_url: profile.avatar_url
        })
    }

    return Array.from(uniqueProfiles.values()).slice(0, 20)
}