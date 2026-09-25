"use client"

import { createPost } from "@/actions/createPost"
import type { SelectedPostLocation } from "@/components/Post/PostLocationPicker"
import { removePostMedia, uploadPostMedia } from "@/lib/posts/uploadPostMedia"
import { useRouter } from "next/navigation"
import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"
import CreatePostExtras from "./CreatePostExtras"
import CreatePostAvatar from "../ui/icons/CreatePostAvatar"
import {
    ALLOWED_TYPES,
    EMOJIS,
    MAX_FILE_SIZE,
    MAX_MEDIA_COUNT
} from "./createPostConfig"
import useCreatePostMentionPrefill from "./useCreatePostMentionPrefill"

type Props = {
    username: string
    displayName: string
    avatarUrl: string | null
}

type SelectedMedia = {
    file: File
    previewUrl: string
}

function CreatePostCard({
    username
}: Props) {
    const [content, setContent] = useState("")
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
    const [selectedLocation, setSelectedLocation] = useState<SelectedPostLocation | null>(null)
    const [error, setError] = useState("")
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEmojiOpen, setIsEmojiOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const submitLock = useRef(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const composerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const router = useRouter()

    useCreatePostMentionPrefill({
        textareaRef,
        setContent,
        setIsExpanded
    })

    const focusComposer = () => {
        setIsExpanded(true)

        requestAnimationFrame(() => {
            textareaRef.current?.focus()
        })
    }

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

        const newMedia = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }))

        setSelectedMedia((current) => [...current, ...newMedia])
        setIsExpanded(true)
        event.target.value = ""
    }

    const handleRemoveMedia = (index: number) => {
        setSelectedMedia((current) => {
            const item = current[index]

            if (item) {
                URL.revokeObjectURL(item.previewUrl)
            }

            return current.filter((_, itemIndex) => itemIndex !== index)
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

        submitLock.current = true
        setIsPending(true)
        setError("")

        let uploadedPaths: string[] = []

        try {
            const uploadedMedia = selectedMedia.length > 0
                ? await uploadPostMedia(selectedMedia.map((item) => item.file))
                : []

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

    const canPublish = Boolean(content.trim()) || selectedMedia.length > 0

    return (
        <div ref={composerRef} className="rounded-t-2xl border-b border-[#ededed] bg-white px-5 py-5">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFilesChange} className="hidden" />

            <div className="flex items-start gap-3">
                <CreatePostAvatar className="size-11 shrink-0" />

                <div className="min-w-0 flex-1">
                    {isExpanded ? (
                        <textarea ref={textareaRef} value={content} onChange={(event) => { setContent(event.target.value); setError("") }} placeholder="Создайте запись" maxLength={5000} autoFocus rows={4} className="min-h-[110] w-full resize-none border-0 bg-transparent px-0 py-[10] text-[14px] leading-5 text-[#202020] outline-none placeholder:text-[#a3a3a3]" />) : (
                        <button type="button" onClick={focusComposer} className="flex h-11 w-full cursor-text items-center text-left text-[14px] text-[#a3a3a3]">
                            Создайте запись
                        </button>
                    )}
                </div>

                <button type="button" onClick={() => { if (!isExpanded) { focusComposer(); return } void handlePublish() }} disabled={isPending || (isExpanded && !canPublish)} className="flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e7e7e7] bg-white px-4 text-[13px] font-semibold text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-[#f7f7f7] disabled:cursor-default disabled:opacity-45">
                    {isPending ? "Публикуем..." : "Опубликовать"}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-3 sm:pl-[56]">
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
                        onToggleEmoji={() => setIsEmojiOpen((current) => !current)}
                        onEmojiSelect={handleEmojiSelect}
                        onLocationChange={handleLocationChange}
                    />
                </div>
            )}

            {error && (
                <div className="mt-2 text-[12px] text-red-500 sm:pl-[56]">
                    {error}
                </div>
            )}
        </div>
    )
}

export default CreatePostCard