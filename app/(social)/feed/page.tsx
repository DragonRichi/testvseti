import FeedHeader from "@/components/Feed/FeedHeader"
import GeoFeed from "@/components/Feed/GeoFeed"
import CreatePostCard from "@/components/Profile/CreatePostCard"
import RadarFeed from "@/components/Radar/RadarFeed"
import RadarSelector from "@/components/Radar/RadarSelector"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { getUserRadars } from "@/lib/radars/getUserRadars"
import { redirect } from "next/navigation"

type Props = {
    searchParams: Promise<{
        radar?: string
    }>
}

async function Page({ searchParams }: Props) {
    const [viewer, resolvedSearchParams] = await Promise.all([
        getCurrentViewer(),
        searchParams
    ])

    if (!viewer) {
        redirect("/")
    }

    const { profile, user } = viewer
    const radars = await getUserRadars(user.id)
    const radarId = resolvedSearchParams.radar
    const activeRadarId = radarId && radars.some((radar) => radar.id === radarId) ? radarId : null

    return (
        <>
            <FeedHeader profile={profile} />

            <div className="flex flex-col gap-4">
                <RadarSelector radars={radars} activeRadarId={activeRadarId} />
                <CreatePostCard username={profile.username} displayName={profile.display_name} avatarUrl={profile.avatar_url} userId={profile.id} />
                {activeRadarId ? <RadarFeed radarId={activeRadarId} currentProfile={profile} /> : <GeoFeed currentProfile={profile} />}
            </div>
        </>
    )
}

export default Page
