import FeedSidebar from "@/components/Feed/FeedSidebar"
import ProfileFeed from "@/components/Profile/ProfileFeed"
import ProfileHeader from "@/components/Profile/ProfileHeader"
import ProfileRightSidebar from "@/components/Profile/ProfileRightSidebar"
import { createClient } from "@/lib/supabase/server"
import { CommentsByPostId } from "@/types/social"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{ username: string }>
}

async function Page({ params }: Props) {

    const { username } = await params

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (currentProfileError || !currentProfile) {
        console.error("CURRENT PROFILE LOAD ERROR: ", currentProfileError)
        redirect("/")
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url,cover_url,bio,birth_date,location_label,website_url,subscriber_count,is_verified,badge_title,interests").eq("username", username.toLowerCase()).single()

    if (profileError || !profile) {
        console.error("PROFILE LOAD ERROR: ", profileError)
        notFound()
    }

    const isOwnProfile = user.id === profile.id

    const { data: posts, count: postsCount, error: postsError } = await supabase.from("posts").select("id,user_id,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility", { count: "exact" }).eq("user_id", profile.id).eq("visibility", "all").order("created_at", { ascending: false })

    if (postsError) {
        console.error("POSTS LOAD ERROR: ", postsError)
    }

    const postIds = (posts ?? []).map((post) => post.id)

    let commentsByPostId: CommentsByPostId = {}

    if (postIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase.from("post_comments").select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").in("post_id", postIds).is("parent_id", null).order("created_at", { ascending: true })

        if (commentsError) {
            console.error("COMMENTS LOAD ERROR: ", commentsError)
        } else if (commentsData && commentsData.length > 0) {
            const userIds = [...new Set(commentsData.map((comment) => comment.user_id))]
            const { data: commentProfiles, error: commentProflesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds)

            if (commentProflesError) {
                console.error("COMMENT PROFILES LOAD ERROR: ", commentProflesError)
            } else {
                const profileMap = new Map((commentProfiles ?? []).map((profile) => [profile.id, profile]))

                commentsData.forEach((comment) => {
                    if (!commentsByPostId[comment.post_id]) {
                        commentsByPostId[comment.post_id] = []
                    }
                    commentsByPostId[comment.post_id].push({
                        ...comment,
                        author: profileMap.get(comment.user_id) ?? null
                    })
                })
            }
        }
    }

    let likedPostIds: string[] = []

    if (postIds.length > 0) {
        const { data: likedPosts, error: likedPostsError } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)

        if (likedPostsError) {
            console.error("LIKED POSTS LOAD ERROR: ", likedPostsError)
        } else {
            likedPostIds = likedPosts.map((like) => like.post_id)
        }
    }

    return (
        <div className="min-h-screen bg-[#f7faf7]">
            <div className="mx-auto grid min-h-screen w-full max-w-[1550] lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">
                <FeedSidebar profile={currentProfile} />
                <main className="min-w-0 px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-4">
                    <ProfileHeader postsCount={postsCount ?? 0} profile={profile} isOwnProfile={isOwnProfile} />
                    <ProfileFeed
                        posts={posts ?? []}
                        isOwnProfile={isOwnProfile}
                        profile={profile}
                        likedPostIds={likedPostIds}
                        currentProfile={currentProfile}
                        commentsByPostId={commentsByPostId}
                    />
                </main>
                <aside className="hidden border-l border-green-100 bg-[#fbfdfb] xl:block">
                    <ProfileRightSidebar profile={profile} />

                </aside>
            </div>
        </div>
    )
}

export default Page
