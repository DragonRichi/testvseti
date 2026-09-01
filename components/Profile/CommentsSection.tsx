"use client"

import { createComment } from "@/actions/createComment"
import type { PostCommentNode, Profile } from "@/types/social"
import { Send } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import CommentItem from "./CommentItem"

type Props = {
    postId: string
    username: string
    currentProfile: Profile
    onCommentCreated: () => void
    onCommentDeleted: (commentCount: number) => void
    initialComments: PostCommentNode[]
    likedCommentIds: string[]
}

function CommentsSection({ currentProfile, onCommentCreated, onCommentDeleted, postId, username, initialComments, likedCommentIds }: Props) {
    const [comments, setComments] = useState<PostCommentNode[]>(initialComments)
    const [content, setContent] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [isPending, setIsPending] = useState<boolean>(false)

    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    const submitLock = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const visibleComments = isExpanded ? comments : comments.slice(-3)
    const hasMoreComments = comments.length > 3

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
                setError(result.error)
                return
            }

            const newComment: PostCommentNode = {
                ...result.comment,
                author: currentProfile,
                replies: []
            }

            setComments((prev) => [...prev, newComment])
            setContent("")

            if (textareaRef.current) {
                textareaRef.current.style.height = "40px"
                textareaRef.current.style.overflowY = "hidden"
            }

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
        <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="flex items-end gap-2">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={currentProfile.avatar_url ?? "/user-avatar.svg"} alt={currentProfile.display_name} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <textarea ref={textareaRef} value={content} onChange={(e) => { setContent(e.target.value); setError(""); e.currentTarget.style.height = "40px"; const nextHeight = Math.min(e.currentTarget.scrollHeight, 120); e.currentTarget.style.height = `${nextHeight}px`; e.currentTarget.style.overflowY = e.currentTarget.scrollHeight > 120 ? "auto" : "hidden" }} placeholder="Комментарий..." maxLength={2000} rows={1} className="min-h-10 max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden rounded-2xl border border-gray-100 bg-[#f4f7f4] px-3.5 py-2.5 text-sm leading-5 outline-none transition-colors placeholder:text-main-gray focus:border-main-green/30 focus:bg-white" />

                <button type="button" onClick={handleSubmit} disabled={isPending || !content.trim()} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                    <Send className="size-4" />
                </button>
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
                <>
                    {!isExpanded && hasMoreComments && (
                        <button type="button" onClick={() => setIsExpanded(true)} className="mt-4 cursor-pointer text-sm font-medium text-main-gray transition-colors hover:text-main-green">
                            Показать все комментарии
                        </button>
                    )}

                    <div className="mt-4 flex flex-col gap-4">
                        {visibleComments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} postId={postId} username={username} currentProfile={currentProfile} initialLiked={likedCommentIds.includes(comment.id)} likedCommentIds={likedCommentIds} onCommentCreated={onCommentCreated} onCommentDeleted={onCommentDeleted} onRemove={(commentId) => setComments((prev) => prev.filter((item) => item.id !== commentId))} />
                        ))}
                    </div>

                    {isExpanded && hasMoreComments && (
                        <button type="button" onClick={() => setIsExpanded(false)} className="mt-4 cursor-pointer text-sm font-medium text-main-gray transition-colors hover:text-main-green">
                            Свернуть комментарии
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

export default CommentsSection