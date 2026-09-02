import SocialLayout from "@/components/Layout/SocialLayout"
import EditTrackingRadar from "@/components/Radar/EditTrackingRadar"
import { getTrackingRadarForEdit } from "@/lib/radars/getTrackingRadarForEdit"
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
        console.error("TRACKING RADAR EDIT PROFILE ERROR:", error)
        redirect("/")
    }

    const radar = await getTrackingRadarForEdit(id)

    if (!radar) notFound()

    return (
        <SocialLayout profile={profile}>
            <EditTrackingRadar radar={radar} />
        </SocialLayout>
    )
}

export default Page