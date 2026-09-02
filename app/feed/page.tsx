import FeedHeader from "@/components/Feed/FeedHeader"
import GeoFeed from "@/components/Feed/GeoFeed"
import SocialLayout from "@/components/Layout/SocialLayout"
import CreatePostCard from "@/components/Profile/CreatePostCard"
import RadarFeed from "@/components/Radar/RadarFeed"
import RadarSelector from "@/components/Radar/RadarSelector"
import { getUserRadars } from "@/lib/radars/getUserRadars"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type Props = {
    searchParams: Promise<{
        radar?: string
    }>
}

async function Page({ searchParams }: Props) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: profile, error } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (error || !profile) {
        console.error("PROFILE LOAD ERROR:", error)
        redirect("/")
    }

    const { radar: radarId } = await searchParams
    const radars = await getUserRadars()

    const activeRadarId = radarId && radars.some((radar) => radar.id === radarId) ? radarId : null

    return (
        <SocialLayout profile={profile}>
            <FeedHeader profile={profile} />

            <div className="flex flex-col gap-4">
                <RadarSelector radars={radars} activeRadarId={activeRadarId} />

                <CreatePostCard userId={profile.id} username={profile.username} displayName={profile.display_name} avatarUrl={profile.avatar_url} />

                {activeRadarId ? (
                    <RadarFeed radarId={activeRadarId} currentProfile={profile} />
                ) : (
                    <GeoFeed currentProfile={profile} />
                )}
            </div>
        </SocialLayout>
    )
}

export default Page