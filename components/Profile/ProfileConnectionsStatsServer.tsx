import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { loadProfileConnections } from "@/lib/follows/loadProfileConnections"
import { createClient } from "@/lib/supabase/server"
import ProfileConnectionsStats from "./ProfileConnectionsStats"

type Props = {
    profileId: string
    subscriberCount: number
    followingCount: number
}

async function ProfileConnectionsStatsServer({
    profileId,
    subscriberCount,
    followingCount
}: Props) {
    const viewer =
        await getCurrentViewer()

    if (!viewer) {
        return (
            <ProfileConnectionsStats
                profileId={profileId}
                subscriberCount={subscriberCount}
                followingCount={followingCount}
                initialFollowing={{
                    items: [],
                    nextCursor: null
                }}
                initialFollowers={{
                    items: [],
                    nextCursor: null
                }}
            />
        )
    }

    const supabase =
        await createClient()

    try {
        const [
            following,
            followers
        ] = await Promise.all([
            loadProfileConnections({
                supabase,
                viewerId:
                    viewer.user.id,
                profileId,
                type: "following"
            }),
            loadProfileConnections({
                supabase,
                viewerId:
                    viewer.user.id,
                profileId,
                type: "followers"
            })
        ])

        return (
            <ProfileConnectionsStats
                profileId={profileId}
                subscriberCount={subscriberCount}
                followingCount={followingCount}
                initialFollowing={following}
                initialFollowers={followers}
            />
        )
    } catch (error) {
        console.error(
            "PROFILE CONNECTION PRELOAD ERROR:",
            error
        )

        return (
            <ProfileConnectionsStats
                profileId={profileId}
                subscriberCount={subscriberCount}
                followingCount={followingCount}
                initialFollowing={{
                    items: [],
                    nextCursor: null
                }}
                initialFollowers={{
                    items: [],
                    nextCursor: null
                }}
            />
        )
    }
}

export default ProfileConnectionsStatsServer