"use client"

import { createPost } from "@/actions/createPost"
import type { SelectedPostLocation } from "@/components/Post/PostLocationPicker"
import { removePostMedia, uploadPostMedia } from "@/lib/posts/uploadPostMedia"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"
import CreatePostExtras from "./CreatePostExtras"

type Props = {
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

function CreatePostCard({ avatarUrl, displayName, username }: Props) {
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
            const uploadedMedia = selectedMedia.length > 0 ? await uploadPostMedia(selectedMedia.map((item) => item.file)) : []

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

            {isExpanded && (
                <CreatePostExtras
                    media={selectedMedia}
                    location={selectedLocation}
                    isPending={isPending}
                    isEmojiOpen={isEmojiOpen}
                    maxMediaCount={MAX_MEDIA_COUNT}
                    emojis={EMOJIS}
                    onRemoveMedia={handleRemoveMedia}
                    onRemoveLocation={() => setSelectedLocation(null)}
                    onPhotoClick={handlePhotoClick}
                    onToggleEmoji={() => setIsEmojiOpen((prev) => !prev)}
                    onEmojiSelect={handleEmojiSelect}
                    onLocationChange={handleLocationChange}
                />
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