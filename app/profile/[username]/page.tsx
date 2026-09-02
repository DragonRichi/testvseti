import SocialLayout from "@/components/Layout/SocialLayout"
import ProfileFeed from "@/components/Profile/ProfileFeed"
import ProfileHeader from "@/components/Profile/ProfileHeader"
import { createClient } from "@/lib/supabase/server"
import type { CommentsByPostId, PostCommentNode } from "@/types/social"
import { notFound, redirect } from "next/navigation"

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

    const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (currentProfileError || !currentProfile) {
        console.error("CURRENT PROFILE LOAD ERROR:", currentProfileError)
        redirect("/")
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url,cover_url,bio,birth_date,location_label,website_url,subscriber_count,is_verified,badge_title,interests").eq("username", username.toLowerCase()).single()

    if (profileError || !profile) {
        console.error("PROFILE LOAD ERROR:", profileError)
        notFound()
    }

    const isOwnProfile = user.id === profile.id

    const { data: posts, error: postsError } = await supabase.from("posts").select("id,user_id,tagged_location_name,content,media_urls,comment_count,like_count,view_count,share_count,created_at,visibility,city,region,country_code").eq("user_id", profile.id).order("created_at", { ascending: false })

    if (postsError) {
        console.error("POSTS LOAD ERROR:", postsError)
    }

    const postsCount = posts?.length ?? 0
    const postIds = (posts ?? []).map((post) => post.id)

    let commentsByPostId: CommentsByPostId = {}
    let commentIds: string[] = []

    if (postIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase.from("post_comments").select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").in("post_id", postIds).order("created_at", { ascending: true })

        if (commentsError) {
            console.error("COMMENTS LOAD ERROR:", commentsError)
        } else if (commentsData && commentsData.length > 0) {
            commentIds = commentsData.map((comment) => comment.id)

            const userIds = [...new Set(commentsData.map((comment) => comment.user_id))]

            const { data: commentProfiles, error: commentProfilesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds)

            if (commentProfilesError) {
                console.error("COMMENT PROFILES LOAD ERROR:", commentProfilesError)
            } else {
                const profileMap = new Map((commentProfiles ?? []).map((commentProfile) => [commentProfile.id, commentProfile]))
                const commentMap = new Map<string, PostCommentNode>()

                commentsData.forEach((comment) => {
                    const commentNode: PostCommentNode = {
                        ...comment,
                        author: profileMap.get(comment.user_id) ?? null,
                        replies: []
                    }

                    commentMap.set(comment.id, commentNode)
                })

                commentsData.forEach((comment) => {
                    const commentNode = commentMap.get(comment.id)

                    if (!commentNode) return

                    if (comment.parent_id) {
                        const parentComment = commentMap.get(comment.parent_id)

                        if (parentComment) {
                            parentComment.replies.push(commentNode)
                            return
                        }
                    }

                    if (!commentsByPostId[comment.post_id]) {
                        commentsByPostId[comment.post_id] = []
                    }

                    commentsByPostId[comment.post_id].push(commentNode)
                })
            }
        }
    }

    let likedPostIds: string[] = []

    if (postIds.length > 0) {
        const { data: likedPosts, error: likedPostsError } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)

        if (likedPostsError) {
            console.error("LIKED POSTS LOAD ERROR:", likedPostsError)
        } else {
            likedPostIds = (likedPosts ?? []).map((like) => like.post_id)
        }
    }

    let likedCommentIds: string[] = []

    if (commentIds.length > 0) {
        const { data: likedComments, error: likedCommentsError } = await supabase.from("comment_likes").select("comment_id").eq("user_id", user.id).in("comment_id", commentIds)

        if (likedCommentsError) {
            console.error("LIKED COMMENTS LOAD ERROR:", likedCommentsError)
        } else {
            likedCommentIds = (likedComments ?? []).map((like) => like.comment_id)
        }
    }

    return (
        <SocialLayout profile={currentProfile}>
            <ProfileHeader postsCount={postsCount} profile={profile} isOwnProfile={isOwnProfile} />

            <ProfileFeed posts={posts ?? []} isOwnProfile={isOwnProfile} profile={profile} likedPostIds={likedPostIds} likedCommentIds={likedCommentIds} currentProfile={currentProfile} commentsByPostId={commentsByPostId} />
        </SocialLayout>
    )
}

export default Page