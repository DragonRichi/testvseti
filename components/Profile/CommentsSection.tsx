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
        <div className="mt-3 rounded-2xl border border-green-200 bg-[#fbfdfb] p-3">
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
                <div className="mt-4 border-t border-green-100">
                    {comments.map((comment) => (
                        <div key={comment.id} className="border-b border-green-100 py-4 last:border-b-0 last:pb-1">
                            <CommentItem
                                comment={comment}
                                postId={postId}
                                username={username}
                                currentProfile={currentProfile}
                                initialLiked={likedCommentIds.includes(comment.id)}
                                likedCommentIds={likedCommentIds}
                                onCommentCreated={onCommentCreated}
                                onCommentDeleted={onCommentDeleted}
                                onRemove={(commentId) => setComments((prev) => prev.filter((item) => item.id !== commentId))}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CommentsSection