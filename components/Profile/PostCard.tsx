"use client"

import { updatePost } from "@/actions/updatePost"
import { MessageCircle, Share2, ThumbsUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import PostActions from "./PostActions"

type Profile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

type Post = {
    id: string
    user_id: string
    content: string | null
    media_urls: string[] | null
    comment_count: number | null
    like_count: number | null
    view_count: number | null
    share_count: number | null
    created_at: string | null
    visibility: string | null
}

type Props = {
    profile: Profile
    post: Post
    isOwnProfile: boolean
}

function PostCard({ profile, post, isOwnProfile }: Props) {
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [content, setContent] = useState<string>(post.content ?? "")
    const [error, setError] = useState<string>("")
    const [isPending, setIsPending] = useState<boolean>(false)

    const updateLock = useRef(false)
    const router = useRouter()

    const handleCancelEdit = () => {
        setContent(post.content ?? "")
        setError("")
        setIsEditing(false)
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
                <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3 text-main-gray">
                    <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                        <ThumbsUp className="size-5" />
                        <span>{post.like_count ?? 0}</span>
                    </button>

                    <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                        <MessageCircle className="size-5" />
                        <span>{post.comment_count ?? 0}</span>
                    </button>

                    <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                        <Share2 className="size-5" />
                        <span>{post.share_count ?? 0}</span>
                    </button>
                </div>
            )}
        </article>
    )
}

export default PostCard