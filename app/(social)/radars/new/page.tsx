import CreatePublicationsRadar from "@/components/Radar/CreatePublicationsRadar"
import RadarTypeSwitch from "@/components/Radar/RadarTypeSwitch"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { getSuggestedRadarProfiles } from "@/lib/radars/getSuggestedRadarProfiles"
import { redirect } from "next/navigation"

async function Page() {
    const viewer = await getCurrentViewer()

    if (!viewer) {
        redirect("/")
    }

    const suggestedProfiles = await getSuggestedRadarProfiles(viewer.user.id)

    return (
        <div className="flex flex-col gap-4">
            <RadarTypeSwitch active="publications" />
            <CreatePublicationsRadar currentUserId={viewer.user.id} suggestedProfiles={suggestedProfiles} />
        </div>
    )
}

export default Page
