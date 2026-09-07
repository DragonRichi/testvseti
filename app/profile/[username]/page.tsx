import SocialLayout from "@/components/Layout/SocialLayout"
import ProfileFeed from "@/components/Profile/ProfileFeed"
import ProfileHeader from "@/components/Profile/ProfileHeader"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

const PROFILE_POSTS_PAGE_SIZE = 10

type Props = {
    params: Promise<{
        username: string
    }>
}

async function Page({ params }: Props) {
    const { username } = await params
    const supabase = await createClient()

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const [{ data: currentProfile, error: currentProfileError }, { data: profile, error: profileError }] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single(),
        supabase.from("profiles").select("id,username,display_name,avatar_url,cover_url,bio,birth_date,location_label,website_url,subscriber_count,following_count,is_verified,badge_title,interests").eq("username", username.toLowerCase()).single()
    ])

    if (currentProfileError || !currentProfile) {
        console.error("CURRENT PROFILE LOAD ERROR:", currentProfileError)
        redirect("/")
    }

    if (profileError || !profile) {
        console.error("PROFILE LOAD ERROR:", profileError)
        notFound()
    }

    const isOwnProfile = user.id === profile.id

    const [postsResult, followResult] = await Promise.all([
        supabase
            .from("posts")
            .select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code,tagged_location_name,tagged_lat,tagged_lon,tagged_city,tagged_region,tagged_country_code", { count: "exact" })
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(0, PROFILE_POSTS_PAGE_SIZE - 1),
        isOwnProfile ? Promise.resolve({ data: null, error: null }) : supabase.from("follows").select("following_id").eq("follower_id", user.id).eq("following_id", profile.id).maybeSingle()
    ])

    if (postsResult.error) {
        console.error("POSTS LOAD ERROR:", postsResult.error)
    }

    if (followResult.error) {
        console.error("PROFILE FOLLOW LOAD ERROR:", followResult.error)
    }

    const posts = postsResult.data ?? []
    const postsCount = postsResult.count ?? posts.length
    const postIds = posts.map((post) => post.id)
    let likedPostIds: string[] = []

    if (postIds.length > 0) {
        const { data: likedPosts, error: likedPostsError } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)

        if (likedPostsError) {
            console.error("LIKED POSTS LOAD ERROR:", likedPostsError)
        } else {
            likedPostIds = (likedPosts ?? []).map((like) => like.post_id)
        }
    }

    return (
        <SocialLayout profile={currentProfile}>
            <ProfileHeader postsCount={postsCount} profile={profile} isOwnProfile={isOwnProfile} isFollowing={Boolean(followResult.data)} />

            <ProfileFeed profile={profile} posts={posts} postsCount={postsCount} isOwnProfile={isOwnProfile} likedPostIds={likedPostIds} currentProfile={currentProfile} />
        </SocialLayout>
    )
}

export default Page