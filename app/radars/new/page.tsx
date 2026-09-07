import SocialLayout from "@/components/Layout/SocialLayout"
import CreatePublicationsRadar from "@/components/Radar/CreatePublicationsRadar"
import RadarTypeSwitch from "@/components/Radar/RadarTypeSwitch"
import { getSuggestedRadarProfiles } from "@/lib/radars/getSuggestedRadarProfiles"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: profile, error } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (error || !profile) {
        console.error("RADAR PAGE PROFILE ERROR:", error)
        redirect("/")
    }

    const suggestedProfiles = await getSuggestedRadarProfiles(profile.id)

    return (
        <SocialLayout profile={profile}>
            <div className="flex flex-col gap-4">
                <RadarTypeSwitch active="publications" />

                <CreatePublicationsRadar currentUserId={profile.id} suggestedProfiles={suggestedProfiles} />
            </div>
        </SocialLayout>
    )
}

export default Page