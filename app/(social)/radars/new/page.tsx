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

    const suggestedProfiles = await getSuggestedRadarProfiles(user.id)

    return (
        <div className="flex flex-col gap-4">
            <RadarTypeSwitch active="publications" />

            <CreatePublicationsRadar currentUserId={user.id} suggestedProfiles={suggestedProfiles} />
        </div>
    )
}

export default Page
