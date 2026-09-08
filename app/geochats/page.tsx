import GeoChatLocationGate from "@/components/GeoChat/GeoChatLocationGate"
import SocialLayout from "@/components/Layout/SocialLayout"
import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect("/")
    }

    const [{ data: profile, error: profileError }, initialAdminMode] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single(),
        hasGeoChatAdminMode()
    ])

    if (profileError || !profile) {
        console.error("GEOCHATS PROFILE LOAD ERROR:", profileError)
        redirect("/")
    }

    return (
        <SocialLayout profile={profile}>
            <GeoChatLocationGate initialAdminMode={initialAdminMode} />
        </SocialLayout>
    )
}

export default Page