"use client"

import { togglePostLike } from "@/actions/togglePostLike"
import { updatePost } from "@/actions/updatePost"
import { removePostMedia, uploadPostMedia } from "@/lib/posts/uploadPostMedia"
import type { Post, PostCommentNode, Profile } from "@/types/social"
import { ImagePlus, MessageCircle, Share2, ThumbsUp, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { ChangeEvent } from "react"
import { useRef, useState } from "react"
import CommentsSection from "./CommentsSection"
import PostActions from "./PostActions"
import PostMediaGrid from "./PostMediaGrid"

type Props = {
    profile: Profile
    post: Post
    isOwnProfile: boolean
    initialLiked: boolean
    currentProfile: Profile
    initialComments: PostCommentNode[]
    likedCommentIds: string[]
}

type SelectedMedia = {
    file: File
    previewUrl: string
}

const MAX_MEDIA_COUNT = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]

function PostCard({ profile, post, isOwnProfile, initialLiked, currentProfile, initialComments, likedCommentIds }: Props) {
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [savedContent, setSavedContent] = useState<string>(post.content ?? "")
    const [content, setContent] = useState<string>(post.content ?? "")
    const [mediaUrls, setMediaUrls] = useState<string[]>(post.media_urls ?? [])
    const [editMediaUrls, setEditMediaUrls] = useState<string[]>(post.media_urls ?? [])
    const [newMedia, setNewMedia] = useState<SelectedMedia[]>([])
    const [error, setError] = useState<string>("")
    const [isPending, setIsPending] = useState<boolean>(false)

    const [isLiked, setIsLiked] = useState<boolean>(initialLiked)
    const [likeCount, setLikeCount] = useState<number>(post.like_count ?? 0)

    const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false)
    const [commentCount, setCommentCount] = useState<number>(post.comment_count ?? 0)

    const updateLock = useRef(false)
    const likeLock = useRef(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    const clearNewMedia = () => {
        newMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        setNewMedia([])
    }

    const handleStartEdit = () => {
        setContent(savedContent)
        setEditMediaUrls(mediaUrls)
        clearNewMedia()
        setError("")
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        setContent(savedContent)
        setEditMediaUrls(mediaUrls)
        clearNewMedia()
        setError("")
        setIsEditing(false)
    }

    const handleAddPhoto = () => {
        if (isPending) return

        if (editMediaUrls.length + newMedia.length >= MAX_MEDIA_COUNT) {
            setError(`Можно добавить не более ${MAX_MEDIA_COUNT} фотографий`)
            return
        }

        fileInputRef.current?.click()
    }

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])

        event.target.value = ""

        if (files.length === 0) return

        setError("")

        const totalCount = editMediaUrls.length + newMedia.length + files.length

        if (totalCount > MAX_MEDIA_COUNT) {
            setError(`Можно добавить не более ${MAX_MEDIA_COUNT} фотографий`)
            return
        }

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError(`Файл "${file.name}" имеет неподдерживаемый формат`)
                return
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`Файл "${file.name}" превышает 10 МБ`)
                return
            }
        }

        const selected: SelectedMedia[] = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }))

        setNewMedia((prev) => [...prev, ...selected])
    }

    const handleRemoveExistingMedia = (url: string) => {
        if (isPending) return

        setEditMediaUrls((prev) => prev.filter((item) => item !== url))
        setError("")
    }

    const handleRemoveNewMedia = (index: number) => {
        if (isPending) return

        setNewMedia((prev) => {
            const item = prev[index]

            if (item) {
                URL.revokeObjectURL(item.previewUrl)
            }

            return prev.filter((_, itemIndex) => itemIndex !== index)
        })

        setError("")
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

    const handleUpdate = async () => {
        if (updateLock.current) return

        const normalizedContent = content.trim()
        const totalMediaCount = editMediaUrls.length + newMedia.length

        if (!normalizedContent && totalMediaCount === 0) {
            setError("Добавьте текст или фотографию")
            return
        }

        if (normalizedContent.length > 5000) {
            setError("Публикация не должна превышать 5000 символов")
            return
        }

        if (totalMediaCount > MAX_MEDIA_COUNT) {
            setError(`Можно добавить не более ${MAX_MEDIA_COUNT} фотографий`)
            return
        }

        updateLock.current = true
        setIsPending(true)
        setError("")

        let uploadedPaths: string[] = []

        try {
            const uploadedMedia = newMedia.length > 0 ? await uploadPostMedia(newMedia.map((item) => item.file), currentProfile.id) : []

            uploadedPaths = uploadedMedia.map((item) => item.path)

            const finalMediaUrls = [
                ...editMediaUrls,
                ...uploadedMedia.map((item) => item.url)
            ]

            const result = await updatePost({
                postId: post.id,
                content: normalizedContent,
                username: profile.username,
                mediaUrls: finalMediaUrls
            })

            if (result.success === false) {
                if (uploadedPaths.length > 0) {
                    await removePostMedia(uploadedPaths)
                }

                setError(result.error)
                return
            }

            console.log("POST UPDATE SUCCESS:", result.post)

            const updatedContent = result.post.content ?? ""
            const updatedMediaUrls = result.post.media_urls ?? []

            newMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))

            setSavedContent(updatedContent)
            setContent(updatedContent)
            setMediaUrls(updatedMediaUrls)
            setEditMediaUrls(updatedMediaUrls)
            setNewMedia([])
            setIsEditing(false)

            router.refresh()
        } catch (error) {
            console.error("POST UPDATE ERROR:", error)

            if (uploadedPaths.length > 0) {
                await removePostMedia(uploadedPaths)
            }

            setError(error instanceof Error ? error.message : "Не удалось обновить публикацию")
        } finally {
            updateLock.current = false
            setIsPending(false)
        }
    }

    return (
        <article className="rounded-2xl border border-green-100 bg-white p-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFilesChange} className="hidden" />

            <div className="flex items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill loading="eager" sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
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
                            <PostActions postId={post.id} username={profile.username} onEdit={handleStartEdit} />
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-3">
                            <textarea value={content} onChange={(e) => { setContent(e.target.value); setError("") }} maxLength={5000} autoFocus placeholder="Что у вас нового?" className="min-h-[120] w-full resize-none rounded-xl border border-gray-100 bg-[#f8faf8] px-4 py-3 text-sm outline-none transition-colors placeholder:text-main-gray focus:border-main-green/40 focus:bg-white" />

                            <div className="mt-2 text-right text-xs text-main-gray">
                                {content.length}/5000
                            </div>

                            {(editMediaUrls.length > 0 || newMedia.length > 0) && (
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {editMediaUrls.map((url, index) => (
                                        <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-[#f4f7f4]">
                                            <Image src={url} alt={`Фото публикации ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />

                                            <button type="button" onClick={() => handleRemoveExistingMedia(url)} disabled={isPending} aria-label="Удалить фото" className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-50">
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {newMedia.map((item, index) => (
                                        <div key={item.previewUrl} className="relative aspect-square overflow-hidden rounded-xl bg-[#f4f7f4]">
                                            <Image src={item.previewUrl} alt={`Новое фото ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" unoptimized className="object-cover" />

                                            <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                                                Новое
                                            </div>

                                            <button type="button" onClick={() => handleRemoveNewMedia(index)} disabled={isPending} aria-label="Удалить фото" className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-50">
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <button type="button" onClick={handleAddPhoto} disabled={isPending || editMediaUrls.length + newMedia.length >= MAX_MEDIA_COUNT} className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-green-100 px-3 text-sm text-main-gray transition-colors hover:bg-green-50 hover:text-main-green disabled:pointer-events-none disabled:opacity-50">
                                    <ImagePlus className="size-4" />
                                    Добавить фото
                                </button>

                                <span className="text-xs text-main-gray">
                                    {editMediaUrls.length + newMedia.length}/{MAX_MEDIA_COUNT} фото
                                </span>
                            </div>

                            {error && (
                                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button type="button" disabled={isPending} onClick={handleCancelEdit} className="h-9 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                                    Отмена
                                </button>

                                <button type="button" disabled={isPending || (!content.trim() && editMediaUrls.length + newMedia.length === 0)} onClick={handleUpdate} className="h-9 cursor-pointer rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                                    {isPending ? "Сохраняем..." : "Сохранить"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {savedContent && (
                                <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-800">
                                    {savedContent}
                                </p>
                            )}

                            {mediaUrls.length > 0 && (
                                <PostMediaGrid mediaUrls={mediaUrls} />
                            )}
                        </>
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
                        <CommentsSection postId={post.id} username={profile.username} currentProfile={currentProfile} onCommentCreated={() => setCommentCount((prev) => prev + 1)} initialComments={initialComments} onCommentDeleted={(newCount) => setCommentCount(newCount)} likedCommentIds={likedCommentIds} />
                    </div>
                </>
            )}
        </article>
    )
}

export default PostCard