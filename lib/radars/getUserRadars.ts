import "server-only"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"

export type UserRadar = {
    id: string
    name: string
    type: "publications" | "tracking"
    sort_mode: string | null
}

export async function getUserRadars(): Promise<UserRadar[]> {
    const user = await getCurrentUser()

    if (!user) return []

    const supabase = await createClient()

    const { data, error } = await supabase.from("radars").select("id,name,type,sort_mode").eq("user_id", user.id).order("created_at", { ascending: false })

    if (error) {
        console.error("USER RADARS LOAD ERROR:", error)
        return []
    }

    return (data ?? []) as UserRadar[]
}