import SocialLayout from "@/components/Layout/SocialLayout"
import EditPublicationsRadar from "@/components/Radar/EditPublicationsRadar"
import { getPublicationsRadarForEdit } from "@/lib/radars/getPublicationsRadarForEdit"
import { getSuggestedRadarProfiles } from "@/lib/radars/getSuggestedRadarProfiles"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

async function Page({ params }: Props) {
    const { id } = await params

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: profile, error } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (error || !profile) {
        console.error("RADAR EDIT PROFILE ERROR:", error)
        redirect("/")
    }

    const radar = await getPublicationsRadarForEdit(id)

    if (!radar) notFound()

    const suggestedProfiles = await getSuggestedRadarProfiles(profile.id)

    return (
        <SocialLayout profile={profile}>
            <EditPublicationsRadar radar={radar} suggestedProfiles={suggestedProfiles} />
        </SocialLayout>
    )
}

export default Page