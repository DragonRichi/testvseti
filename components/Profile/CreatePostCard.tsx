"use client"

import { createPost } from "@/actions/createPost"
import { removePostMedia, uploadPostMedia } from "@/lib/posts/uploadPostMedia"
import { BarChart3, ImagePlus, Smile, Video, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChangeEvent, useRef, useState } from "react"

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

function CreatePostCard({ userId, avatarUrl, displayName, username }: Props) {
    const [content, setContent] = useState<string>("")
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
    const [error, setError] = useState<string>("")
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [isPending, setIsPending] = useState<boolean>(false)

    const submitLock = useRef(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handlePhotoClick = () => {
        if (isPending) return

        setIsExpanded(true)
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
                mediaUrls: uploadedMedia.map((item) => item.url)
            })

            if (!result.success) {
                if (uploadedPaths.length > 0) {
                    await removePostMedia(uploadedPaths)
                }

                setError(result.error || "Не удалось создать публикацию")
                return
            }

            console.log("POST CREATE SUCCESS:", result.post)

            setContent("")
            clearSelectedMedia()
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
        <div className="rounded-2xl border border-green-100 bg-white p-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFilesChange} className="hidden" />

            <div className="flex items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={avatarUrl ?? "/user-avatar.svg"} alt={displayName} fill sizes="44px" loading="eager" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                    {isExpanded ? (
                        <textarea value={content} onChange={(e) => { setContent(e.target.value); setError("") }} placeholder="Что у вас нового?" maxLength={5000} autoFocus className="min-h-[110] w-full resize-none rounded-xl border border-gray-100 bg-[#f8faf8] px-4 py-3 text-sm outline-none transition-colors placeholder:text-main-gray focus:border-main-green/40 focus:bg-white" />
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

            {selectedMedia.length > 0 && (
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

            {error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-1 border-t border-gray-100 pt-3">
                <button type="button" onClick={handlePhotoClick} disabled={isPending || selectedMedia.length >= MAX_MEDIA_COUNT} className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2 ${selectedMedia.length > 0 ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <ImagePlus className="size-5" />
                    <span className="text-xs sm:text-sm">Фото</span>
                </button>

                <button type="button" className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-main-gray transition-colors hover:bg-green-50 hover:text-main-green sm:flex-row sm:gap-2">
                    <Video className="size-5" />
                    <span className="text-xs sm:text-sm">Видео</span>
                </button>

                <button type="button" className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-main-gray transition-colors hover:bg-green-50 hover:text-main-green sm:flex-row sm:gap-2">
                    <BarChart3 className="size-5" />
                    <span className="text-xs sm:text-sm">Опрос</span>
                </button>

                <button type="button" className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-main-gray transition-colors hover:bg-green-50 hover:text-main-green sm:flex-row sm:gap-2">
                    <Smile className="size-5" />
                    <span className="text-xs sm:text-sm">Настроение</span>
                </button>
            </div>

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