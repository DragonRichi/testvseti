import { createClient } from "@/lib/supabase/server"
import { cache } from "react"

const getCurrentViewer = cache(async () => {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return null
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,subscriber_count,following_count")
        .eq("id", user.id)
        .single()

    if (profileError || !profile) {
        console.error("CURRENT VIEWER PROFILE LOAD ERROR:", profileError)
        return null
    }

    return {
        user,
        profile
    }
})

export default getCurrentViewer
