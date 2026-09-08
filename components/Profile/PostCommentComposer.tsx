"use client"

import { createComment } from "@/actions/createComment"
import type { PagedPostComment } from "@/types/postComments"
import type { Profile } from "@/types/social"
import { LoaderCircle, Send } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

type Props = {
    postId: string
    username: string
    currentProfile: Profile
    onCreated: (comment: PagedPostComment) => void
}

function PostCommentComposer({ postId, username, currentProfile, onCreated }: Props) {
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)
    const submitLockRef = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = async () => {
        if (submitLockRef.current) return

        const normalizedContent = content.trim()
        if (!normalizedContent) return

        submitLockRef.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createComment({ content: normalizedContent, postId, username })

            if (result.success === false) {
                setError(result.error)
                return
            }

            onCreated({
                ...result.comment,
                author: currentProfile,
                replies: [],
                replyCount: 0,
                repliesLoaded: true,
                initialLiked: false
            })

            setContent("")

            if (textareaRef.current) {
                textareaRef.current.style.height = "40px"
                textareaRef.current.style.overflowY = "hidden"
            }
        } catch (submitError) {
            console.error("COMMENT CREATE ERROR:", submitError)
            setError("Не удалось добавить комментарий")
        } finally {
            submitLockRef.current = false
            setIsPending(false)
        }
    }

    return (
        <>
            <div className="flex items-end gap-2">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={currentProfile.avatar_url ?? "/user-avatar.svg"} alt={currentProfile.display_name} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <textarea ref={textareaRef} value={content} onChange={(event) => { setContent(event.target.value); setError(""); event.currentTarget.style.height = "40px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 120); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 120 ? "auto" : "hidden" }} placeholder="Комментарий..." maxLength={2000} rows={1} className="min-h-10 max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden rounded-2xl border border-gray-100 bg-[#f4f7f4] px-3.5 py-2.5 text-sm leading-5 outline-none transition-colors placeholder:text-main-gray focus:border-main-green/30 focus:bg-white" />

                <button type="button" onClick={() => void handleSubmit()} disabled={isPending || !content.trim()} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
            </div>

            {error && <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
        </>
    )
}

export default PostCommentComposer
