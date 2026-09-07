"use client"

import { togglePostLike } from "@/actions/togglePostLike"
import type { Post, Profile } from "@/types/social"
import { MapPin, MessageCircle, Share2, ThumbsUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef, useState } from "react"
import CommentsSection from "./CommentsSection"
import PostActions from "./PostActions"
import PostEditForm from "./PostEditForm"
import PostMediaGrid from "./PostMediaGrid"

type Props = {
    profile: Profile
    post: Post
    isOwnProfile: boolean
    initialLiked: boolean
    currentProfile: Profile
    eagerMedia: boolean
}

const POST_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
})

const REGION_NAMES = new Intl.DisplayNames(["ru"], {
    type: "region"
})

function PostCard({ profile, post, isOwnProfile, initialLiked, currentProfile, eagerMedia }: Props) {
    const [displayPost, setDisplayPost] = useState(post)
    const [isEditing, setIsEditing] = useState(false)
    const [isLiked, setIsLiked] = useState(initialLiked)
    const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [hasOpenedComments, setHasOpenedComments] = useState(false)
    const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)

    const likeLock = useRef(false)

    const handleLike = async () => {
        if (likeLock.current) return

        likeLock.current = true

        const previousLiked = isLiked
        const previousLikeCount = likeCount
        const nextLiked = !previousLiked

        setIsLiked(nextLiked)
        setLikeCount(Math.max(0, previousLikeCount + (nextLiked ? 1 : -1)))

        try {
            const result = await togglePostLike({
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
            console.error("POST LIKE ERROR:", error)
            setIsLiked(previousLiked)
            setLikeCount(previousLikeCount)
        } finally {
            likeLock.current = false
        }
    }

    const handleToggleComments = () => {
        setIsCommentsOpen((current) => {
            const next = !current

            if (next) setHasOpenedComments(true)

            return next
        })
    }

    const hasTaggedLocation = Boolean(displayPost.tagged_location_name) && typeof displayPost.tagged_lat === "number" && typeof displayPost.tagged_lon === "number"
    const locationDetails = [displayPost.tagged_city, displayPost.tagged_country_code ? REGION_NAMES.of(displayPost.tagged_country_code) : null].filter(Boolean).join(", ")

    return (
        <article className="rounded-2xl border border-green-100 bg-white p-4">
            <div className="flex items-start gap-3">
                <Link href={`/profile/${profile.username}`} className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <Link href={`/profile/${profile.username}`} className="font-bold">{profile.display_name}</Link>

                            <div className="mt-0.5 text-xs text-main-gray">
                                @{profile.username}
                                {displayPost.created_at && <> · {POST_DATE_FORMATTER.format(new Date(displayPost.created_at))}</>}
                            </div>
                        </div>

                        {isOwnProfile && !isEditing && <PostActions postId={displayPost.id} username={profile.username} onEdit={() => setIsEditing(true)} />}
                    </div>

                    {isEditing ? (
                        <PostEditForm post={displayPost} username={profile.username} onCancel={() => setIsEditing(false)} onSaved={(updatedPost) => { setDisplayPost(updatedPost); setLikeCount(updatedPost.like_count ?? likeCount); setCommentCount(updatedPost.comment_count ?? commentCount); setIsEditing(false) }} />
                    ) : (
                        <>
                            {hasTaggedLocation && (
                                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                    <div className="flex min-w-0 items-center gap-1.5 text-main-green">
                                        <MapPin className="size-4 shrink-0" />
                                        <span className="truncate font-medium">{displayPost.tagged_location_name}</span>
                                    </div>

                                    {locationDetails && <span className="text-xs text-gray-400">{locationDetails}</span>}
                                </div>
                            )}

                            {displayPost.content && <p className={`${hasTaggedLocation ? "mt-2" : "mt-3"} whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-800`}>{displayPost.content}</p>}

                            {(displayPost.media_urls?.length ?? 0) > 0 && <PostMediaGrid mediaUrls={displayPost.media_urls ?? []} eager={eagerMedia} />}
                        </>
                    )}
                </div>
            </div>

            {!isEditing && (
                <>
                    <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3 text-main-gray">
                        <button type="button" onClick={() => void handleLike()} className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-main-green" : "text-main-gray hover:text-main-green"}`}>
                            <ThumbsUp className={`size-5 ${isLiked ? "fill-main-green" : ""}`} />
                            <span>{likeCount}</span>
                        </button>

                        <button type="button" onClick={handleToggleComments} className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${isCommentsOpen ? "text-main-green" : "text-main-gray hover:text-main-green"}`}>
                            <MessageCircle className="size-5" />
                            <span>{commentCount}</span>
                        </button>

                        <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                            <Share2 className="size-5" />
                            <span>{displayPost.share_count ?? 0}</span>
                        </button>
                    </div>

                    {hasOpenedComments && (
                        <div className={isCommentsOpen ? "block" : "hidden"}>
                            <CommentsSection postId={displayPost.id} username={profile.username} currentProfile={currentProfile} onCommentCreated={() => setCommentCount((current) => current + 1)} onCommentDeleted={setCommentCount} />
                        </div>
                    )}
                </>
            )}
        </article>
    )
}

export default PostCard