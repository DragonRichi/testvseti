import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Post } from "@/types/social"

type Props = {
    limit?: number
    offset?: number
}

export async function getGeoFeed({ limit = 20, offset = 0 }: Props = {}): Promise<Post[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_geo_feed", {
        p_limit: limit,
        p_offset: offset
    })

    if (error) {
        console.error("GEO FEED LOAD ERROR:", error)
        return []
    }

    return data ?? []
}