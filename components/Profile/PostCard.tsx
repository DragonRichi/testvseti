"use client"

import { updatePost } from "@/actions/updatePost"
import { MessageCircle, Share2, ThumbsUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import PostActions from "./PostActions"
import { togglePostLike } from "@/actions/togglePostLike"
import CommentsSection from "./CommentsSection"
import { Post, PostComment, Profile } from "@/types/social"

type Props = {
    profile: Profile
    post: Post
    isOwnProfile: boolean
    initialLiked: boolean
    currentProfile: Profile
    initialComments: PostComment[]
}

function PostCard({ profile, post, isOwnProfile, initialLiked, currentProfile, initialComments }: Props) {
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [content, setContent] = useState<string>(post.content ?? "")
    const [error, setError] = useState<string>("")
    const [isPending, setIsPending] = useState<boolean>(false)

    const [isLiked, setIsLiked] = useState<boolean>(initialLiked)
    const [likeCount, setLikeCount] = useState<number>(post.like_count ?? 0)

    const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false)
    const [commentCount, setCommentCount] = useState<number>(post.comment_count ?? 0)


    const updateLock = useRef(false)
    const likeLock = useRef(false)
    const router = useRouter()

    const handleCancelEdit = () => {
        setContent(post.content ?? "")
        setError("")
        setIsEditing(false)
    }

    const handleLike = async () => {
        if (likeLock.current) return

        likeLock.current = true

        const previousLiked = isLiked
        const previousLikeCount = likeCount
        const nextLiked = !isLiked

        setIsLiked(nextLiked)
        setLikeCount(Math.max(0, previousLikeCount + (nextLiked ? 1 : -1)))

        try {
            const result = await togglePostLike({ postId: post.id, username: profile.username })

            if (!result.success) {
                setIsLiked(previousLiked)
                setLikeCount(previousLikeCount)
                return
            }

            setIsLiked(result.liked)
            setLikeCount(result.likeCount)

        } catch (error) {
            console.error("POST LIKE ERROR: ", error)
            setIsLiked(previousLiked)
            setLikeCount(previousLikeCount)
        } finally {
            likeLock.current = false
        }
    }

    const handleUpdate = async () => {
        if (updateLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) {
            setError("Введите текст публикации")
            return
        }

        if (normalizedContent.length > 5000) {
            setError("Публикация не должна превышать 5000 символов")
            return
        }

        updateLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await updatePost({ postId: post.id, content: normalizedContent, username: profile.username })

            if (!result.success) {
                setError(result.error || "Не удалось обновить публикацию")
                return
            }

            console.log("POST UPDATE SUCCESS:", result.post)

            setContent(normalizedContent)
            setIsEditing(false)
            router.refresh()
        } catch (error) {
            console.error("POST UPDATE ERROR:", error)
            setError("Не удалось обновить публикацию")
        } finally {
            updateLock.current = false
            setIsPending(false)
        }
    }

    return (
        <article className="rounded-2xl border border-green-100 bg-white p-4">
            <div className="flex items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="font-bold">
                                {profile.display_name}
                            </div>

                            <div className="mt-0.5 text-xs text-main-gray">
                                @{profile.username}

                                {post.created_at && (
                                    <> · {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_at))}</>
                                )}
                            </div>
                        </div>

                        {isOwnProfile && !isEditing && (
                            <PostActions postId={post.id} username={profile.username} onEdit={() => setIsEditing(true)} />
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-3">
                            <textarea value={content} onChange={(e) => { setContent(e.target.value); setError("") }} maxLength={5000} autoFocus className="min-h-[120] w-full resize-none rounded-xl border border-gray-100 bg-[#f8faf8] px-4 py-3 text-sm outline-none transition-colors focus:border-main-green/40 focus:bg-white" />

                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-main-gray">
                                    {content.length}/5000
                                </span>

                                <div className="flex items-center gap-2">
                                    <button type="button" disabled={isPending} onClick={handleCancelEdit} className="h-9 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                                        Отмена
                                    </button>

                                    <button type="button" disabled={isPending || !content.trim()} onClick={handleUpdate} className="h-9 cursor-pointer rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                                        {isPending ? "Сохраняем..." : "Сохранить"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        post.content && (
                            <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-800">
                                {post.content}
                            </p>
                        )
                    )}
                </div>
            </div>

            {!isEditing && (
                <>
                    <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3 text-main-gray">
                        <button type="button" onClick={handleLike} className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-main-green" : "text-main-gray hover:text-main-green"}`}>
                            <ThumbsUp className={`size-5 ${isLiked ? "fill-main-green" : ""}`} />
                            <span>{likeCount}</span>
                        </button>

                        <button type="button" onClick={() => setIsCommentsOpen((prev) => !prev)} className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${isCommentsOpen ? "text-main-green" : "text-main-gray hover:text-main-green"}`}>
                            <MessageCircle className="size-5" />
                            <span>{commentCount}</span>
                        </button>

                        <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                            <Share2 className="size-5" />
                            <span>{post.share_count ?? 0}</span>
                        </button>
                    </div>
                    <div className={isCommentsOpen ? "block" : "hidden"}>
                        <CommentsSection
                            postId={post.id}
                            username={profile.username}
                            currentProfile={currentProfile}
                            onCommentCreated={() => setCommentCount((prev) => prev + 1)}
                            initialComments={initialComments}
                            onCommentDeleted={(newCount)=>setCommentCount(newCount)}
                        />
                    </div>

                </>
            )}
        </article>
    )
}

export default PostCard