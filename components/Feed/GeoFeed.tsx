import PostCard from "@/components/Profile/PostCard"
import { getGeoFeed } from "@/lib/feed/getGeoFeed"
import { createClient } from "@/lib/supabase/server"
import type { CommentsByPostId, PostComment, PostCommentNode, Profile } from "@/types/social"

type Props = {
    currentProfile: Profile
}

type RawComment = Omit<PostComment, "author">

async function GeoFeed({ currentProfile }: Props) {
    const supabase = await createClient()

    const posts = await getGeoFeed({
        limit: 20,
        offset: 0
    })

    if (posts.length === 0) {
        return (
            <div className="flex min-h-[300] items-center justify-center rounded-2xl border border-green-100 bg-white px-5 text-center text-sm text-main-gray">
                В ленте пока нет публикаций
            </div>
        )
    }

    const postIds = posts.map((post) => post.id)

    const [{ data: comments, error: commentsError }, { data: postLikes, error: postLikesError }] = await Promise.all([
        supabase.from("post_comments").select("id,post_id,user_id,parent_id,content,media_url,likes_count,created_at,updated_at").in("post_id", postIds).order("created_at", { ascending: true }),
        supabase.from("post_likes").select("post_id").eq("user_id", currentProfile.id).in("post_id", postIds)
    ])

    if (commentsError) {
        console.error("FEED COMMENTS LOAD ERROR:", commentsError)
    }

    if (postLikesError) {
        console.error("FEED POST LIKES LOAD ERROR:", postLikesError)
    }

    const rawComments = (comments ?? []) as RawComment[]
    const commentIds = rawComments.map((comment) => comment.id)

    const userIds = Array.from(new Set([
        ...posts.map((post) => post.user_id),
        ...rawComments.map((comment) => comment.user_id)
    ]))

    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds)

    if (profilesError) {
        console.error("FEED PROFILES LOAD ERROR:", profilesError)
    }

    let likedCommentIds: string[] = []

    if (commentIds.length > 0) {
        const { data: commentLikes, error: commentLikesError } = await supabase.from("comment_likes").select("comment_id").eq("user_id", currentProfile.id).in("comment_id", commentIds)

        if (commentLikesError) {
            console.error("FEED COMMENT LIKES LOAD ERROR:", commentLikesError)
        } else {
            likedCommentIds = (commentLikes ?? []).map((like) => like.comment_id)
        }
    }

    const profilesById = new Map<string, Profile>()

    for (const profile of profiles ?? []) {
        profilesById.set(profile.id, profile)
    }

    const commentMap = new Map<string, PostCommentNode>()

    for (const comment of rawComments) {
        commentMap.set(comment.id, {
            ...comment,
            author: profilesById.get(comment.user_id) ?? null,
            replies: []
        })
    }

    const commentsByPostId: CommentsByPostId = {}

    for (const comment of rawComments) {
        const node = commentMap.get(comment.id)

        if (!node) continue

        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id)

            if (parent) {
                parent.replies.push(node)
                continue
            }
        }

        if (!commentsByPostId[comment.post_id]) {
            commentsByPostId[comment.post_id] = []
        }

        commentsByPostId[comment.post_id].push(node)
    }

    const likedPostIds = (postLikes ?? []).map((like) => like.post_id)

    return (
        <div className="flex flex-col gap-4">
            {posts.map((post, index) => {
                const author = profilesById.get(post.user_id)

                if (!author) return null

                return (
                    <PostCard
                        key={post.id}
                        post={post}
                        profile={author}
                        currentProfile={currentProfile}
                        isOwnProfile={post.user_id === currentProfile.id}
                        initialLiked={likedPostIds.includes(post.id)}
                        initialComments={commentsByPostId[post.id] ?? []} likedCommentIds={likedCommentIds}
                        eagerMedia={index === 0}
                    />
                )
            })}
        </div>
    )
}

export default GeoFeed