import EnvironmentPage from "@/components/EnvironmentPage/EnvironmentPage"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { loadProfileConnections } from "@/lib/follows/loadProfileConnections"
import { createClient } from "@/lib/supabase/server"
import type { ProfileConnectionCursor, ProfileConnectionItem } from "@/types/follows"
import { redirect } from "next/navigation"

type ConnectionsPage = {
    items: ProfileConnectionItem[]
    nextCursor: ProfileConnectionCursor | null
}

const emptyConnectionsPage: ConnectionsPage = {
    items: [],
    nextCursor: null
}

async function Page() {
    const viewer = await getCurrentViewer()

    if (!viewer) {
        redirect("/")
    }

    const supabase = await createClient()
    const { user, profile } = viewer

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

    const followersPage: ConnectionsPage = followersResult.status === "fulfilled" ? followersResult.value : emptyConnectionsPage
    const followingPage: ConnectionsPage = followingResult.status === "fulfilled" ? followingResult.value : emptyConnectionsPage
    const followerCount = Math.max(0, profile.subscriber_count ?? followersPage.items.length)
    const followingCount = Math.max(0, profile.following_count ?? followingPage.items.length)

    return (
        <EnvironmentPage
            key={`${followerCount}:${followingCount}`}
            profileId={user.id}
            initialFollowers={followersPage.items}
            initialFollowing={followingPage.items}
            followerCount={followerCount}
            followingCount={followingCount}
            initialFollowersCursor={followersPage.nextCursor}
            initialFollowingCursor={followingPage.nextCursor}
        />
    )
}

export default Page
