import EnvironmentPage from "@/components/EnvironmentPage/EnvironmentPage"
import SocialLayout from "@/components/Layout/SocialLayout"
import { loadProfileConnections } from "@/lib/follows/loadProfileConnections"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) redirect("/")

    const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url,subscriber_count,following_count").eq("id", user.id).single()

    if (currentProfileError || !currentProfile) {
        console.error("ENVIRONMENT CURRENT PROFILE LOAD ERROR:", currentProfileError)
        redirect("/")
    }

    const [followersResult, followingResult] = await Promise.allSettled([
        loadProfileConnections({
            supabase,
            viewerId: user.id,
            profileId: user.id,
            type: "followers"
        }),
        loadProfileConnections({
            supabase,
            viewerId: user.id,
            profileId: user.id,
            type: "following"
        })
    ])

    if (followersResult.status === "rejected") {
        console.error("ENVIRONMENT FOLLOWERS LOAD ERROR:", followersResult.reason)
    }

    if (followingResult.status === "rejected") {
        console.error("ENVIRONMENT FOLLOWING LOAD ERROR:", followingResult.reason)
    }

    const followersPage = followersResult.status === "fulfilled" ? followersResult.value : {
        items: [],
        hasMore: false,
        nextOffset: 0
    }

    const followingPage = followingResult.status === "fulfilled" ? followingResult.value : {
        items: [],
        hasMore: false,
        nextOffset: 0
    }

    const followerCount = Math.max(0, currentProfile.subscriber_count ?? followersPage.items.length)
    const followingCount = Math.max(0, currentProfile.following_count ?? followingPage.items.length)

    return (
        <SocialLayout profile={currentProfile}>
            <EnvironmentPage key={`${followerCount}:${followingCount}`} profileId={user.id} initialFollowers={followersPage.items} initialFollowing={followingPage.items} followerCount={followerCount} followingCount={followingCount} initialFollowersHasMore={followersPage.hasMore} initialFollowingHasMore={followingPage.hasMore} initialFollowersOffset={followersPage.nextOffset} initialFollowingOffset={followingPage.nextOffset} />
        </SocialLayout>
    )
}

export default Page