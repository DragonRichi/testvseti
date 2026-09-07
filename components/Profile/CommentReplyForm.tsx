"use client"

import { createComment } from "@/actions/createComment"
import type { PostCommentNode, Profile } from "@/types/social"
import { CornerUpLeft, Send, X } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

type Props = {
    postId: string
    parentCommentId: string
    username: string
    replyToUsername: string | null
    currentProfile: Profile
    onCreated: (comment: PostCommentNode) => void
    onCancel: () => void
}

function CommentReplyForm({ postId, parentCommentId, username, replyToUsername, currentProfile, onCreated, onCancel }: Props) {
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)
    const submitLock = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = async () => {
        if (submitLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) return

        submitLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createComment({ postId, content: normalizedContent, username, parentId: parentCommentId })

            if (result.success === false) {
                setError(result.error)
                return
            }

            onCreated({
                ...result.comment,
                author: currentProfile,
                replies: []
            })
        } catch (error) {
            console.error("COMMENT REPLY ERROR:", error)
            setError("Не удалось отправить ответ")
        } finally {
            submitLock.current = false
            setIsPending(false)
        }
    }

    return (
        <div className="mt-3">
            {replyToUsername && (
                <div className="mb-2 ml-10 flex items-center justify-between gap-3 rounded-xl bg-green-50 px-3 py-2 text-xs">
                    <div className="flex min-w-0 items-center gap-1 text-main-gray">
                        <CornerUpLeft className="size-3.5 shrink-0 text-main-green" />
                        <span className="shrink-0">Ответ для</span>
                        <span className="truncate font-medium text-main-green">@{replyToUsername}</span>
                    </div>

                    <button type="button" onClick={onCancel} disabled={isPending} aria-label="Отменить ответ" className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900 disabled:pointer-events-none disabled:opacity-50">
                        <X className="size-3.5" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={currentProfile.avatar_url ?? "/user-avatar.svg"} alt={currentProfile.display_name} fill sizes="32px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <textarea ref={textareaRef} value={content} onChange={(event) => { setContent(event.target.value); setError(""); event.currentTarget.style.height = "36px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 120); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 120 ? "auto" : "hidden" }} placeholder={replyToUsername ? `Ответ @${replyToUsername}...` : "Ваш ответ..."} maxLength={2000} rows={1} autoFocus className="min-h-9 max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden rounded-2xl border border-gray-100 bg-[#f4f7f4] px-3.5 py-2 text-sm leading-5 outline-none transition-colors placeholder:text-main-gray focus:border-main-green/30 focus:bg-white" />

                <button type="button" onClick={() => void handleSubmit()} disabled={isPending || !content.trim()} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                    <Send className="size-4" />
                </button>
            </div>

            {error && <div className="mt-2 pl-10 text-xs text-red-600">{error}</div>}
        </div>
    )
}

export default CommentReplyForm