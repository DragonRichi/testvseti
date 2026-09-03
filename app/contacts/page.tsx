import EnvironmentPage from "@/components/EnvironmentPage/EnvironmentPage"
import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import type { ProfileConnectionItem } from "@/types/follows"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) redirect("/")

    const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (currentProfileError || !currentProfile) {
        console.error("ENVIRONMENT CURRENT PROFILE LOAD ERROR:", currentProfileError)
        redirect("/")
    }

    const [{ data: followerRelations, error: followersError }, { data: followingRelations, error: followingError }] = await Promise.all([
        supabase.from("follows").select("follower_id,created_at").eq("following_id", user.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("following_id,created_at").eq("follower_id", user.id).order("created_at", { ascending: false })
    ])

    if (followersError) {
        console.error("ENVIRONMENT FOLLOWERS LOAD ERROR:", followersError)
    }

    if (followingError) {
        console.error("ENVIRONMENT FOLLOWING LOAD ERROR:", followingError)
    }

    const followerIds = (followerRelations ?? []).map((relation) => relation.follower_id)
    const followingIds = (followingRelations ?? []).map((relation) => relation.following_id)

    const allProfileIds = Array.from(new Set([...followerIds, ...followingIds]))

    const { data: profiles, error: profilesError } = allProfileIds.length > 0
        ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", allProfileIds)
        : { data: [], error: null }

    if (profilesError) {
        console.error("ENVIRONMENT PROFILES LOAD ERROR:", profilesError)
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const myFollowingIds = new Set(followingIds)

    const followers: ProfileConnectionItem[] = []

    for (const profileId of followerIds) {
        const profile = profilesById.get(profileId)

        if (!profile) continue

        followers.push({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name ?? profile.username,
            avatarUrl: profile.avatar_url,
            isFollowing: myFollowingIds.has(profile.id),
            isCurrentUser: false
        })
    }

    const following: ProfileConnectionItem[] = []

    for (const profileId of followingIds) {
        const profile = profilesById.get(profileId)

        if (!profile) continue

        following.push({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name ?? profile.username,
            avatarUrl: profile.avatar_url,
            isFollowing: true,
            isCurrentUser: false
        })
    }

    return (
        <SocialLayout profile={currentProfile}>
            <EnvironmentPage followers={followers} following={following} />
        </SocialLayout>
    )
}

export default Page