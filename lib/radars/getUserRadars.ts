import "server-only"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

export type UserRadar = {
    id: string
    name: string
    type: "publications" | "tracking"
    sort_mode: string | null
}

export async function getUserRadars(userId: string): Promise<UserRadar[]> {
    if (!isUuid(userId)) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("radars")
        .select("id,name,type,sort_mode")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("USER RADARS LOAD ERROR:", error)
        return []
    }

    return (data ?? []) as UserRadar[]
}
