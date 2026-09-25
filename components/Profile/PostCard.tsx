"use client"

import { togglePostLike } from "@/actions/togglePostLike"
import type { Post, Profile } from "@/types/social"
import { useRef, useState } from "react"
import PostCardContent from "../Feed/PostCardContent"
import PostCardFooter from "../Feed/PostCardFooter"
import PostCardHeader from "../Feed/PostCardHeader"
import CommentsSection from "./CommentsSection"
import PostEditForm from "./PostEditForm"
import usePostCommentsPreload from "./usePostCommentsPreload"

type Props = {
    profile: Profile
    post: Post
    isOwnProfile: boolean
    initialLiked: boolean
    currentProfile: Profile
    eagerMedia: boolean
    onDeleted?: (postId: string) => void
}

function PostCard({
    profile,
    post,
    isOwnProfile,
    initialLiked,
    currentProfile,
    eagerMedia,
    onDeleted
}: Props) {
    const [displayPost, setDisplayPost] = useState(post)
    const [isDeleted, setIsDeleted] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const [isLiked, setIsLiked] = useState(initialLiked)
    const [likeCount, setLikeCount] = useState(post.like_count ?? 0)

    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [hasOpenedComments, setHasOpenedComments] = useState(false)
    const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)

    const likeLock = useRef(false)

    const commentsPreloadRef = usePostCommentsPreload(
        displayPost.id,
        commentCount > 0
    )

    const handleLike = async () => {
        if (likeLock.current) return

        likeLock.current = true

        const previousLiked = isLiked
        const previousLikeCount = likeCount
        const nextLiked = !previousLiked

        setIsLiked(nextLiked)
        setLikeCount(
            Math.max(
                0,
                previousLikeCount +
                (nextLiked ? 1 : -1)
            )
        )

        try {
            const result =
                await togglePostLike({
                    postId: displayPost.id,
                    username: profile.username
                })

            if (result.success === false) {
                setIsLiked(previousLiked)
                setLikeCount(previousLikeCount)
                return
            }

            setIsLiked(result.liked)
            setLikeCount(result.likeCount)
        } catch (error) {
            console.error(
                "POST LIKE ERROR:",
                error
            )

            setIsLiked(previousLiked)
            setLikeCount(previousLikeCount)
        } finally {
            likeLock.current = false
        }
    }

    const handleToggleComments = () => {
        setIsCommentsOpen(
            (current) => {
                const next = !current

                if (next) {
                    setHasOpenedComments(true)
                }

                return next
            }
        )
    }

    const handleDeleted = (
        postId: string
    ) => {
        setIsDeleted(true)
        onDeleted?.(postId)
    }

    const handleCommentCreated = () => {
        setCommentCount(
            (current) =>
                current + 1
        )
    }

    const handleCommentDeleted = (
        newCount: number
    ) => {
        setCommentCount(
            newCount
        )
    }

    if (isDeleted) {
        return null
    }

    return (
        <article
            ref={commentsPreloadRef}
            className="border-b border-[#e5e5e5] bg-white px-4 py-5 sm:px-5"
        >
            <div className="flex items-start gap-3">
                <PostCardHeader
                    profile={profile}
                    createdAt={
                        displayPost.created_at
                    }
                />

                <div className="min-w-0 flex-1">
                    {isEditing ? (
                        <PostEditForm
                            post={
                                displayPost
                            }
                            username={
                                profile.username
                            }
                            onCancel={() =>
                                setIsEditing(
                                    false
                                )
                            }
                            onSaved={(
                                updatedPost
                            ) => {
                                setDisplayPost(
                                    updatedPost
                                )

                                setLikeCount(
                                    updatedPost.like_count ??
                                    likeCount
                                )

                                setCommentCount(
                                    updatedPost.comment_count ??
                                    commentCount
                                )

                                setIsEditing(
                                    false
                                )
                            }}
                        />
                    ) : (
                        <PostCardContent
                            post={
                                displayPost
                            }
                            profile={
                                profile
                            }
                            eagerMedia={
                                eagerMedia
                            }
                        />
                    )}

                    {!isEditing && (
                        <PostCardFooter
                            post={
                                displayPost
                            }
                            username={
                                profile.username
                            }
                            isOwnProfile={
                                isOwnProfile
                            }
                            isLiked={
                                isLiked
                            }
                            likeCount={
                                likeCount
                            }
                            commentCount={
                                commentCount
                            }
                            isCommentsOpen={
                                isCommentsOpen
                            }
                            onLike={() =>
                                void handleLike()
                            }
                            onToggleComments={
                                handleToggleComments
                            }
                            onEdit={() =>
                                setIsEditing(
                                    true
                                )
                            }
                            onDeleted={
                                handleDeleted
                            }
                        />
                    )}
                </div>
            </div>

            {!isEditing &&
                hasOpenedComments && (
                    <div className={isCommentsOpen ? "block sm:pl-[52]" : "hidden"}>
                        <CommentsSection
                            postId={
                                displayPost.id
                            }
                            username={
                                profile.username
                            }
                            currentProfile={
                                currentProfile
                            }
                            onCommentCreated={
                                handleCommentCreated
                            }
                            onCommentDeleted={
                                handleCommentDeleted
                            }
                            enabled={
                                isCommentsOpen
                            }
                        />
                    </div>
                )}
        </article>
    )
}

export default PostCard