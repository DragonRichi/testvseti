"use client"

import { createComment } from "@/actions/createComment"
import { PostComment, Profile } from "@/types/social"
import { Send } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

type Props = {
    postId: string
    username: string
    currentProfile: Profile
    onCommentCreated: () => void
    initialComments: PostComment[]
}

function CommentsSection({ currentProfile, onCommentCreated, postId, username, initialComments }: Props) {
    const [comments, setComments] = useState<PostComment[]>(initialComments)
    const [content, setContent] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [isPending, setIsPending] = useState<boolean>(false)

    const submitLock = useRef(false)

    const handleSubmit = async () => {
        if (submitLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) return

        submitLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createComment({ content: normalizedContent, postId, username })

            if (result.success === false) {
                setError(result.error || "Не удалось добавить комментарий")
                return
            }

            const newComment: PostComment = {
                ...result.comment,
                author: currentProfile
            }

            setComments((prev) => [...prev, newComment])
            setContent("")
            onCommentCreated()
        } catch (error) {
            console.error("COMMENT CREATE ERROR:", error)
            setError("Не удалось добавить комментарий")
        } finally {
            submitLock.current = false
            setIsPending(false)
        }
    }

    return (
        <div className="mt-3 border-t border-gray-100 pt-4">
            <div className="flex items-start gap-3">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={currentProfile.avatar_url ?? "/user-avatar.svg"} alt={currentProfile.display_name} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <div className="flex min-w-0 flex-1 items-end gap-2">
                    <textarea value={content} onChange={(e) => { setContent(e.target.value); setError("") }} placeholder="Написать комментарий..." maxLength={2000} rows={1} className="min-h-10 max-h-[140] flex-1 resize-none rounded-xl border border-gray-100 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-main-gray focus:border-main-green/40 focus:bg-white" />

                    <button type="button" onClick={handleSubmit} disabled={isPending || !content.trim()} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                        <Send className="size-4" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

            {comments.length === 0 ? (
                <div className="py-5 text-center text-sm text-main-gray">
                    Комментариев пока нет
                </div>
            ) : (
                <div className="mt-4 flex flex-col gap-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                <Image src={comment.author?.avatar_url ?? "/user-avatar.svg"} alt={comment.author?.display_name ?? "Пользователь"} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="rounded-2xl bg-[#f7f9f7] px-3.5 py-2.5">
                                    <div className="text-sm font-semibold">
                                        {comment.author?.display_name ?? "Пользователь"}
                                    </div>

                                    <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-800">
                                        {comment.content}
                                    </div>
                                </div>

                                <div className="mt-1 flex items-center gap-3 px-2 text-xs text-main-gray">
                                    <span>
                                        {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(comment.created_at))}
                                    </span>

                                    <button type="button" className="cursor-pointer font-medium transition-colors hover:text-main-green">
                                        Ответить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CommentsSection