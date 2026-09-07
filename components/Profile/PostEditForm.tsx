"use client"

import { updatePost } from "@/actions/updatePost"
import PostLocationPicker, { type SelectedPostLocation } from "@/components/Post/PostLocationPicker"
import { removePostMedia, uploadPostMedia } from "@/lib/posts/uploadPostMedia"
import type { Post } from "@/types/social"
import { ImagePlus, MapPin, X } from "lucide-react"
import Image from "next/image"
import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"

type Props = {
    post: Post
    username: string
    onCancel: () => void
    onSaved: (post: Post) => void
}

type SelectedMedia = {
    file: File
    previewUrl: string
}

const MAX_MEDIA_COUNT = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function getPostLocation(post: Post): SelectedPostLocation | null {
    if (!post.tagged_location_name || typeof post.tagged_lat !== "number" || typeof post.tagged_lon !== "number") return null

    return {
        name: post.tagged_location_name,
        latitude: post.tagged_lat,
        longitude: post.tagged_lon
    }
}

function PostEditForm({ post, username, onCancel, onSaved }: Props) {
    const [content, setContent] = useState(post.content ?? "")
    const [mediaUrls, setMediaUrls] = useState<string[]>(post.media_urls ?? [])
    const [newMedia, setNewMedia] = useState<SelectedMedia[]>([])
    const [location, setLocation] = useState<SelectedPostLocation | null>(getPostLocation(post))
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)

    const updateLock = useRef(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const newMediaRef = useRef<SelectedMedia[]>([])

    useEffect(() => {
        return () => {
            newMediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
            newMediaRef.current = []
        }
    }, [])

    const setNewMediaState = (items: SelectedMedia[]) => {
        newMediaRef.current = items
        setNewMedia(items)
    }

    const clearNewMedia = () => {
        newMediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        newMediaRef.current = []
        setNewMedia([])
    }

    const handleCancel = () => {
        if (isPending) return

        clearNewMedia()
        onCancel()
    }

    const handleAddPhoto = () => {
        if (isPending) return

        if (mediaUrls.length + newMedia.length >= MAX_MEDIA_COUNT) {
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

        if (mediaUrls.length + newMedia.length + files.length > MAX_MEDIA_COUNT) {
            setError(`Можно добавить не более ${MAX_MEDIA_COUNT} фотографий`)
            return
        }

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError(`Файл "${file.name}" имеет неподдерживаемый формат`)
                return
            }

            if (file.size <= 0) {
                setError(`Файл "${file.name}" пуст`)
                return
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`Файл "${file.name}" превышает 10 МБ`)
                return
            }
        }

        const selected = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }))

        setNewMediaState([...newMediaRef.current, ...selected])
    }

    const handleRemoveExistingMedia = (url: string) => {
        if (isPending) return

        setMediaUrls((current) => current.filter((item) => item !== url))
        setError("")
    }

    const handleRemoveNewMedia = (index: number) => {
        if (isPending) return

        const current = newMediaRef.current
        const item = current[index]

        if (item) URL.revokeObjectURL(item.previewUrl)

        setNewMediaState(current.filter((_, itemIndex) => itemIndex !== index))
        setError("")
    }

    const handleUpdate = async () => {
        if (updateLock.current) return

        const normalizedContent = content.trim()
        const totalMediaCount = mediaUrls.length + newMedia.length

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
            const uploadedMedia = newMedia.length > 0 ? await uploadPostMedia(newMedia.map((item) => item.file)) : []

            uploadedPaths = uploadedMedia.map((item) => item.path)

            const result = await updatePost({
                postId: post.id,
                content: normalizedContent,
                username,
                mediaUrls: [...mediaUrls, ...uploadedMedia.map((item) => item.url)],
                taggedLocation: location
            })

            if (result.success === false) {
                if (uploadedPaths.length > 0) await removePostMedia(uploadedPaths)

                setError(result.error)
                return
            }

            clearNewMedia()
            onSaved(result.post)
        } catch (error) {
            console.error("POST UPDATE ERROR:", error)

            if (uploadedPaths.length > 0) await removePostMedia(uploadedPaths)

            setError(error instanceof Error ? error.message : "Не удалось обновить публикацию")
        } finally {
            updateLock.current = false
            setIsPending(false)
        }
    }

    return (
        <div className="mt-3">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFilesChange} className="hidden" />

            <textarea value={content} onChange={(event) => { setContent(event.target.value); setError("") }} maxLength={5000} autoFocus placeholder="Что у вас нового?" className="min-h-[120] w-full resize-none rounded-xl border border-gray-100 bg-[#f8faf8] px-4 py-3 text-sm outline-none transition-colors placeholder:text-main-gray focus:border-main-green/40 focus:bg-white" />

            <div className="mt-2 text-right text-xs text-main-gray">{content.length}/5000</div>

            {(mediaUrls.length > 0 || newMedia.length > 0) && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {mediaUrls.map((url, index) => (
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

                            <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">Новое</div>

                            <button type="button" onClick={() => handleRemoveNewMedia(index)} disabled={isPending} aria-label="Удалить фото" className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-50">
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {location && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                    <MapPin className="size-4 shrink-0 text-main-green" />
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{location.name}</div>

                    <button type="button" onClick={() => { setLocation(null); setError("") }} disabled={isPending} aria-label="Убрать место" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-red-500 disabled:pointer-events-none disabled:opacity-50">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleAddPhoto} disabled={isPending || mediaUrls.length + newMedia.length >= MAX_MEDIA_COUNT} className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-green-100 px-3 text-sm text-main-gray transition-colors hover:bg-green-50 hover:text-main-green disabled:pointer-events-none disabled:opacity-50">
                        <ImagePlus className="size-4" />
                        Добавить фото
                    </button>

                    <PostLocationPicker value={location} onChange={(nextLocation) => { setLocation(nextLocation); setError("") }} variant="toolbar" disabled={isPending} />
                </div>

                <span className="text-xs text-main-gray">{mediaUrls.length + newMedia.length}/{MAX_MEDIA_COUNT} фото</span>
            </div>

            {error && <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}

            <div className="mt-3 flex items-center justify-end gap-2">
                <button type="button" disabled={isPending} onClick={handleCancel} className="h-9 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">Отмена</button>

                <button type="button" disabled={isPending || (!content.trim() && mediaUrls.length + newMedia.length === 0)} onClick={() => void handleUpdate()} className="h-9 cursor-pointer rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">{isPending ? "Сохраняем..." : "Сохранить"}</button>
            </div>
        </div>
    )
}

export default PostEditForm