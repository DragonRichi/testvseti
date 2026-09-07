"use client"

import { toggleCommentLike } from "@/actions/toggleCommentLike"
import type { PostCommentNode, Profile } from "@/types/social"
import { CornerUpLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef, useState } from "react"
import CommentActions from "./CommentActions"
import CommentEditForm from "./CommentEditForm"
import CommentReplyForm from "./CommentReplyForm"

type Props = {
    comment: PostCommentNode
    postId: string
    username: string
    currentProfile: Profile
    initialLiked: boolean
    likedCommentIds: string[]
    onCommentCreated: () => void
    onCommentDeleted: (commentCount: number) => void
    onRemove: (commentId: string) => void
    depth?: number
    replyToUsername?: string | null
}

const COMMENT_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
})

const EDITED_DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
})

function CommentItem({ comment, postId, username, currentProfile, initialLiked, likedCommentIds, onCommentCreated, onCommentDeleted, onRemove, depth = 0, replyToUsername = null }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [content, setContent] = useState(comment.content)
    const [updatedAt, setUpdatedAt] = useState(comment.updated_at)
    const [replies, setReplies] = useState<PostCommentNode[]>(comment.replies ?? [])
    const [isReplying, setIsReplying] = useState(false)
    const [isLiked, setIsLiked] = useState(initialLiked)
    const [likesCount, setLikesCount] = useState(Number(comment.likes_count ?? 0))
    const likeLock = useRef(false)

    const isEdited = new Date(updatedAt).getTime() > new Date(comment.created_at).getTime() + 1000
    const authorUsername = comment.author?.username ?? null

    const handleLike = async () => {
        if (likeLock.current) return

        likeLock.current = true

        const previousLiked = isLiked
        const previousLikesCount = likesCount
        const nextLiked = !previousLiked

        setIsLiked(nextLiked)
        setLikesCount(Math.max(0, previousLikesCount + (nextLiked ? 1 : -1)))

        try {
            const result = await toggleCommentLike({ commentId: comment.id, username })

            if (result.success === false) {
                setIsLiked(previousLiked)
                setLikesCount(previousLikesCount)
                return
            }

            setIsLiked(result.liked)
            setLikesCount(result.likesCount)
        } catch (error) {
            console.error("COMMENT LIKE ERROR:", error)
            setIsLiked(previousLiked)
            setLikesCount(previousLikesCount)
        } finally {
            likeLock.current = false
        }
    }

    const handleToggleReply = () => {
        setIsReplying((current) => !current)
    }

    return (
        <div>
            <div className="flex items-start gap-3">
                {authorUsername ? (
                    <Link href={`/profile/${authorUsername}`} className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                        <Image src={comment.author?.avatar_url ?? "/user-avatar.svg"} alt={comment.author?.display_name ?? "Пользователь"} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                    </Link>
                ) : (
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                        <Image src="/user-avatar.svg" alt="Пользователь" fill sizes="36px" className="object-cover" />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-[#f4f7f4] px-3.5 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                            {authorUsername ? (
                                <Link href={`/profile/${authorUsername}`} className="min-w-0 truncate text-sm font-semibold">{comment.author?.display_name ?? "Пользователь"}</Link>
                            ) : (
                                <span className="min-w-0 truncate text-sm font-semibold">{comment.author?.display_name ?? "Пользователь"}</span>
                            )}

                            {comment.user_id === currentProfile.id && !isEditing && <CommentActions commentId={comment.id} postId={postId} username={username} onEdit={() => setIsEditing(true)} onDeleted={(commentCount) => { onRemove(comment.id); onCommentDeleted(commentCount) }} />}
                        </div>

                        {replyToUsername && !isEditing && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-main-gray">
                                <CornerUpLeft className="size-3.5 shrink-0" />
                                <span>Ответ</span>
                                <Link href={`/profile/${replyToUsername}`} className="font-medium text-main-green hover:underline">@{replyToUsername}</Link>
                            </div>
                        )}

                        {isEditing ? (
                            <CommentEditForm commentId={comment.id} username={username} initialContent={content} onCancel={() => setIsEditing(false)} onSaved={(nextContent, nextUpdatedAt) => { setContent(nextContent); setUpdatedAt(nextUpdatedAt); setIsEditing(false) }} />
                        ) : (
                            <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-800">{content}</div>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-main-gray">
                            <span className="whitespace-nowrap">
                                {COMMENT_DATE_FORMATTER.format(new Date(comment.created_at))}
                                {isEdited && <>{" · "}<span title={`Изменено ${EDITED_DATE_FORMATTER.format(new Date(updatedAt))}`} className="cursor-default">изменено</span></>}
                            </span>

                            <button type="button" onClick={() => void handleLike()} className={`cursor-pointer whitespace-nowrap font-medium transition-colors ${isLiked ? "text-main-green" : "hover:text-main-green"}`}>Нравится&nbsp;{likesCount > 0 && `(${likesCount})`}</button>

                            <button type="button" onClick={handleToggleReply} className="cursor-pointer whitespace-nowrap font-medium transition-colors hover:text-main-green">Ответить</button>
                        </div>
                    )}

                    {isReplying && (
                        <CommentReplyForm postId={postId} parentCommentId={comment.id} username={username} replyToUsername={authorUsername} currentProfile={currentProfile} onCancel={() => setIsReplying(false)} onCreated={(newReply) => { setReplies((current) => [...current, newReply]); setIsReplying(false); onCommentCreated() }} />
                    )}
                </div>
            </div>

            {replies.length > 0 && (
                <div className={depth === 0 ? "ml-6 mt-2 sm:ml-9" : "mt-2"}>
                    <div className="flex flex-col gap-3">
                        {replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} postId={postId} username={username} currentProfile={currentProfile} initialLiked={likedCommentIds.includes(reply.id)} likedCommentIds={likedCommentIds} depth={depth + 1} replyToUsername={comment.author?.username ?? null} onCommentCreated={onCommentCreated} onCommentDeleted={onCommentDeleted} onRemove={(commentId) => setReplies((current) => current.filter((item) => item.id !== commentId))} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CommentItem