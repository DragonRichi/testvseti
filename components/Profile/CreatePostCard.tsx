"use client"

import { createPost } from "@/actions/createPost"
import PostLocationPicker, { type SelectedPostLocation } from "@/components/Post/PostLocationPicker"
import { removePostMedia, uploadPostMedia } from "@/lib/posts/uploadPostMedia"
import { BarChart3, ImagePlus, MapPin, Smile, Video, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"

type Props = {
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
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

const EMOJIS = [
    "😀", "😃", "😄", "😁", "😂", "🤣", "😊", "😉", "😍", "🥰",
    "😘", "😋", "😎", "🤩", "🥳", "😅", "🙂", "🙃", "🤔",
    "😢", "😭", "😡", "😱", "😴", "🤗", "🤭", "❤️",
    "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕", "💯",
    "👍", "👎", "👏", "🙏", "💪", "🤝", "✌️", "🤟", "👌", "👀",
    "🔥", "🎉", "🎊", "✨", "⭐", "💫", "🚀", "✅", "❌", "⚡",
    "🌍", "☀️", "🌙", "🌧️", "❄️", "🌈", "🌊", "🌳",
    "📍", "📸", "🎥", "🎵", "🎧", "⚽", "🏀", "🏆", "🎮", "💻"
]

function CreatePostCard({ userId, avatarUrl, displayName, username }: Props) {
    const [content, setContent] = useState<string>("")
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
    const [selectedLocation, setSelectedLocation] = useState<SelectedPostLocation | null>(null)
    const [error, setError] = useState<string>("")
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [isEmojiOpen, setIsEmojiOpen] = useState<boolean>(false)
    const [isPending, setIsPending] = useState<boolean>(false)

    const submitLock = useRef(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const composerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const router = useRouter()

    useEffect(() => {
        if (!isExpanded) return

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node

            if (composerRef.current?.contains(target)) return
            if (isPending) return

            setIsEmojiOpen(false)
            setIsExpanded(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("touchstart", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [isExpanded, isPending])

    const handlePhotoClick = () => {
        if (isPending) return

        setIsExpanded(true)
        setIsEmojiOpen(false)
        fileInputRef.current?.click()
    }

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])

        if (files.length === 0) return

        setError("")

        if (selectedMedia.length + files.length > MAX_MEDIA_COUNT) {
            setError(`Можно добавить не более ${MAX_MEDIA_COUNT} фотографий`)
            event.target.value = ""
            return
        }

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError(`Файл "${file.name}" имеет неподдерживаемый формат`)
                event.target.value = ""
                return
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`Файл "${file.name}" превышает 10 МБ`)
                event.target.value = ""
                return
            }
        }

        const newMedia: SelectedMedia[] = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }))

        setSelectedMedia((prev) => [...prev, ...newMedia])
        setIsExpanded(true)
        event.target.value = ""
    }

    const handleRemoveMedia = (index: number) => {
        setSelectedMedia((prev) => {
            const item = prev[index]

            if (item) {
                URL.revokeObjectURL(item.previewUrl)
            }

            return prev.filter((_, itemIndex) => itemIndex !== index)
        })
    }

    const clearSelectedMedia = () => {
        selectedMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        setSelectedMedia([])
    }

    const handleLocationChange = (location: SelectedPostLocation | null) => {
        setSelectedLocation(location)
        setError("")
        setIsEmojiOpen(false)

        if (location) {
            setIsExpanded(true)
        }
    }

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current

        if (!textarea) {
            const nextContent = `${content}${emoji}`

            if (nextContent.length <= 5000) {
                setContent(nextContent)
            }

            return
        }

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const nextContent = `${content.slice(0, start)}${emoji}${content.slice(end)}`

        if (nextContent.length > 5000) return

        setContent(nextContent)
        setError("")

        requestAnimationFrame(() => {
            textarea.focus()

            const nextPosition = start + emoji.length

            textarea.setSelectionRange(nextPosition, nextPosition)
        })
    }

    const handlePublish = async () => {
        if (submitLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent && selectedMedia.length === 0) {
            setError("Добавьте текст или фотографию")
            return
        }

        if (normalizedContent.length > 5000) {
            setError("Публикация не должна превышать 5000 символов")
            return
        }

        submitLock.current = true
        setIsPending(true)
        setError("")

        let uploadedPaths: string[] = []

        try {
            const uploadedMedia = selectedMedia.length > 0 ? await uploadPostMedia(selectedMedia.map((item) => item.file), userId) : []

            uploadedPaths = uploadedMedia.map((item) => item.path)

            const result = await createPost({
                content: normalizedContent,
                username,
                mediaUrls: uploadedMedia.map((item) => item.url),
                taggedLocation: selectedLocation
            })

            if (result.success === false) {
                if (uploadedPaths.length > 0) {
                    await removePostMedia(uploadedPaths)
                }

                setError(result.error || "Не удалось создать публикацию")
                return
            }

            console.log("POST CREATE SUCCESS:", result.post)

            setContent("")
            clearSelectedMedia()
            setSelectedLocation(null)
            setIsEmojiOpen(false)
            setIsExpanded(false)
            router.refresh()
        } catch (error) {
            console.error("POST CREATE ERROR:", error)

            if (uploadedPaths.length > 0) {
                await removePostMedia(uploadedPaths)
            }

            setError(error instanceof Error ? error.message : "Не удалось создать публикацию")
        } finally {
            submitLock.current = false
            setIsPending(false)
        }
    }

    return (
        <div ref={composerRef} className="rounded-2xl border border-green-100 bg-white p-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFilesChange} className="hidden" />

            <div className="flex items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={avatarUrl ?? "/user-avatar.svg"} alt={displayName} fill sizes="44px" loading="eager" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                    {isExpanded ? (
                        <textarea ref={textareaRef} value={content} onChange={(event) => { setContent(event.target.value); setError("") }} placeholder="Что у вас нового?" maxLength={5000} autoFocus className="min-h-[110] w-full resize-none rounded-xl border border-gray-100 bg-[#f8faf8] px-4 py-3 text-sm outline-none transition-colors placeholder:text-main-gray focus:border-main-green/40 focus:bg-white" />
                    ) : (
                        <button type="button" onClick={() => setIsExpanded(true)} className="flex h-11 w-full cursor-pointer items-center rounded-xl border border-gray-100 bg-[#f8faf8] px-4 text-left text-sm text-main-gray transition-colors hover:border-green-100 hover:bg-green-50/50">
                            Что у вас нового?
                        </button>
                    )}

                    {isExpanded && (
                        <div className="mt-2 text-right text-xs text-main-gray">
                            {content.length}/5000
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && selectedMedia.length > 0 && (
                <div className="mt-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {selectedMedia.map((item, index) => (
                            <div key={item.previewUrl} className="group relative aspect-square overflow-hidden rounded-xl bg-[#f4f7f4]">
                                <Image src={item.previewUrl} alt={`Фото ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" unoptimized className="object-cover" />

                                <button type="button" onClick={() => handleRemoveMedia(index)} disabled={isPending} className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-50">
                                    <X className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 text-right text-xs text-main-gray">
                        {selectedMedia.length}/{MAX_MEDIA_COUNT} фото
                    </div>
                </div>
            )}

            {isExpanded && selectedLocation && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                    <MapPin className="size-4 shrink-0 text-main-green" />

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-700">{selectedLocation.name}</div>
                    </div>

                    <button type="button" onClick={() => setSelectedLocation(null)} disabled={isPending} aria-label="Убрать место" title="Убрать место" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-red-500 disabled:pointer-events-none disabled:opacity-50">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {isExpanded && error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

            {isExpanded && (
                <div className="mt-4 grid grid-cols-5 gap-1 border-t border-gray-100 pt-3">
                    <button type="button" onClick={handlePhotoClick} disabled={isPending || selectedMedia.length >= MAX_MEDIA_COUNT} className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2 ${selectedMedia.length > 0 ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                        <ImagePlus className="size-5" />
                        <span className="text-xs sm:text-sm">Фото</span>
                    </button>

                    {/* <button type="button" disabled={isPending} className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-main-gray transition-colors hover:bg-green-50 hover:text-main-green disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2">
                        <Video className="size-5" />
                        <span className="text-xs sm:text-sm">Видео</span>
                    </button>

                    <button type="button" disabled={isPending} className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-main-gray transition-colors hover:bg-green-50 hover:text-main-green disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2">
                        <BarChart3 className="size-5" />
                        <span className="text-xs sm:text-sm">Опрос</span>
                    </button> */}

                    <button type="button" onClick={() => setIsEmojiOpen((prev) => !prev)} disabled={isPending} className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2 ${isEmojiOpen ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                        <Smile className="size-5" />
                        <span className="text-xs sm:text-sm">Эмодзи</span>
                    </button>

                    <PostLocationPicker value={selectedLocation} onChange={handleLocationChange} variant="toolbar" disabled={isPending} />
                </div>
            )}

            {isExpanded && isEmojiOpen && (
                <div className="mt-2 rounded-2xl border border-green-100 bg-white p-3 shadow-sm">
                    <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
                        {EMOJIS.map((emoji, index) => (
                            <button key={`${emoji}-${index}`} type="button" onClick={() => handleEmojiSelect(emoji)} disabled={isPending} className="flex aspect-square cursor-pointer items-center justify-center rounded-lg text-xl transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-50">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isExpanded && (
                <div className="mt-3 flex justify-end">
                    <button type="button" onClick={handlePublish} disabled={isPending || (!content.trim() && selectedMedia.length === 0)} className="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-main-green px-5 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                        {isPending ? "Публикуем..." : "Опубликовать"}
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreatePostCard