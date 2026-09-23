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

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const [radar, suggestedProfiles] = await Promise.all([
        getPublicationsRadarForEdit(id),
        getSuggestedRadarProfiles(user.id)
    ])

    if (!radar) notFound()

    return (
        <EditPublicationsRadar radar={radar} suggestedProfiles={suggestedProfiles} />
    )
}

export default Page
