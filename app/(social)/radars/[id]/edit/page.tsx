import EditPublicationsRadar from "@/components/Radar/EditPublicationsRadar"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { getPublicationsRadarForEdit } from "@/lib/radars/getPublicationsRadarForEdit"
import { getSuggestedRadarProfiles } from "@/lib/radars/getSuggestedRadarProfiles"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

async function Page({ params }: Props) {
    const [{ id }, viewer] = await Promise.all([
        params,
        getCurrentViewer()
    ])

    if (!viewer) {
        redirect("/")
    }

    const [radar, suggestedProfiles] = await Promise.all([
        getPublicationsRadarForEdit(id),
        getSuggestedRadarProfiles(viewer.user.id)
    ])

    if (!radar) {
        notFound()
    }

    return (
        <EditPublicationsRadar radar={radar} suggestedProfiles={suggestedProfiles} />
    )
}

export default Page
