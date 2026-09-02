import SocialLayout from "@/components/Layout/SocialLayout"
import CreateTrackingRadar from "@/components/Radar/CreateTrackingRadar"
import RadarTypeSwitch from "@/components/Radar/RadarTypeSwitch"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: profile, error } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (error || !profile) {
        console.error("TRACKING RADAR PAGE PROFILE ERROR:", error)
        redirect("/")
    }

    return (
        <SocialLayout profile={profile}>
            <div className="flex flex-col gap-4">
                <RadarTypeSwitch active="tracking" />

                <CreateTrackingRadar />
            </div>
        </SocialLayout>
    )
}

export default Page