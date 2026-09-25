"use client"

import { createComment } from "@/actions/createComment"
import UserAvatar from "@/components/ui/UserAvatar"
import type { PagedPostComment } from "@/types/postComments"
import type { Profile } from "@/types/social"
import { LoaderCircle, Send } from "lucide-react"
import { KeyboardEvent, useRef, useState } from "react"

type Props = {
    postId: string
    username: string
    currentProfile: Profile
    onCreated: (comment: PagedPostComment) => void
}

function PostCommentComposer({
    postId,
    username,
    currentProfile,
    onCreated
}: Props) {
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)

    const submitLockRef = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const resizeTextarea = (
        textarea: HTMLTextAreaElement
    ) => {
        textarea.style.height = "40px"

        const nextHeight =
            Math.min(
                textarea.scrollHeight,
                120
            )

        textarea.style.height =
            `${nextHeight}px`

        textarea.style.overflowY =
            textarea.scrollHeight > 120
                ? "auto"
                : "hidden"
    }

    const handleSubmit = async () => {
        if (submitLockRef.current) return

        const normalizedContent =
            content.trim()

        if (!normalizedContent) return

        submitLockRef.current = true
        setIsPending(true)
        setError("")

        try {
            const result =
                await createComment({
                    content:
                        normalizedContent,
                    postId,
                    username
                })

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
                textareaRef.current.style.height =
                    "40px"

                textareaRef.current.style.overflowY =
                    "hidden"
            }
        } catch (error) {
            console.error(
                "COMMENT CREATE ERROR:",
                error
            )

            setError(
                "Не удалось добавить комментарий"
            )
        } finally {
            submitLockRef.current = false
            setIsPending(false)
        }
    }

    const handleKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (
            event.key !== "Enter" ||
            event.shiftKey
        ) {
            return
        }

        event.preventDefault()

        void handleSubmit()
    }

    return (
        <>
            <div className="flex items-end gap-2.5">
                <UserAvatar
                    userId={currentProfile.id}
                    displayName={currentProfile.display_name}
                    avatarUrl={currentProfile.avatar_url}
                    size={36}
                />

                <div className="flex min-h-10 min-w-0 flex-1 items-end rounded-xl border border-[#e7e7e7] bg-white transition-colors focus-within:border-[#d8d8d8]">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(event) => {
                            setContent(event.target.value)
                            setError("")
                            resizeTextarea(event.currentTarget)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Написать комментарий..."
                        maxLength={2000}
                        rows={1}
                        className="min-h-10 max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-3.5 py-2.5 text-[14px] leading-5 text-[#303030] outline-none placeholder:text-[#999]"
                    />
                </div>

                <button
                    type="button"
                    onClick={() =>
                        void handleSubmit()
                    }
                    disabled={
                        isPending ||
                        !content.trim()
                    }
                    aria-label="Отправить комментарий"
                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:bg-[#d8d8d8]"
                >
                    {isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                        <Send
                            className="size-[17]"
                            strokeWidth={1.8}
                        />
                    )}
                </button>
            </div>

            {error && (
                <div className="ml-[46] mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">
                    {error}
                </div>
            )}
        </>
    )
}

export default PostCommentComposer