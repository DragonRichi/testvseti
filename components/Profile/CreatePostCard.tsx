"use client"

import { createPost } from "@/actions/createPost"
import { BarChart3, ImagePlus, Smile, Video } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

type Props = {
    username: string
    displayName: string
    avatarUrl: string | null
}

function CreatePostCard({ avatarUrl, displayName, username }: Props) {
    const [content, setContent] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [isPending, setIsPending] = useState<boolean>(false)

    const submitLock = useRef(false)
    const router = useRouter()

    const handlePublish = async () => {
        if (submitLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) {
            setError("Введите текст публикации")
            return
        }

        if (normalizedContent.length > 5000) {
            setError("Публикация не должна превышать 5000 символов")
            return
        }

        submitLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createPost({ content: normalizedContent, username })

            if (!result.success) {
                setError(result.error || "Не удалось создать публикацию")
                return
            }

            console.log("POST CREATE SUCCESS:", result.post)

            setContent("")
            setIsExpanded(false)
            router.refresh()
        } catch (error) {
            console.error("POST CREATE ERROR:", error)
            setError("Не удалось создать публикацию")
        } finally {
            submitLock.current = false
            setIsPending(false)
        }
    }

    return (
        <div className="rounded-2xl border border-green-100 bg-white p-4">
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

            {error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-1 border-t border-gray-100 pt-3">
                <button type="button" className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-main-gray transition-colors hover:bg-green-50 hover:text-main-green sm:flex-row sm:gap-2">
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
                    <button type="button" onClick={handlePublish} disabled={isPending || !content.trim()} className="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-main-green px-5 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                        {isPending ? "Публикуем..." : "Опубликовать"}
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreatePostCard