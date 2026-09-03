"use client"

import { createComment } from "@/actions/createComment"
import { toggleCommentLike } from "@/actions/toggleCommentLike"
import { updateComment } from "@/actions/updateComment"
import type { PostCommentNode, Profile } from "@/types/social"
import { Send } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import CommentActions from "./CommentActions"
import Link from "next/link"

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
}

function CommentItem({ comment, postId, username, currentProfile, initialLiked, likedCommentIds, onCommentCreated, onCommentDeleted, onRemove, depth = 0 }: Props) {
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [content, setContent] = useState<string>(comment.content)
    const [updatedAt, setUpdatedAt] = useState<string>(comment.updated_at)
    const [replies, setReplies] = useState<PostCommentNode[]>(comment.replies ?? [])
    const [isReplying, setIsReplying] = useState<boolean>(false)
    const [isLiked, setIsLiked] = useState<boolean>(initialLiked)
    const [likesCount, setLikesCount] = useState<number>(Number(comment.likes_count ?? 0))
    const [replyContent, setReplyContent] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [replyError, setReplyError] = useState<string>("")
    const [isPending, setIsPending] = useState<boolean>(false)
    const [isReplyPending, setIsReplyPending] = useState<boolean>(false)

    const updateLock = useRef(false)
    const replyLock = useRef(false)
    const likeLock = useRef(false)
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null)

    const isEdited = new Date(updatedAt).getTime() > new Date(comment.created_at).getTime() + 1000

    const handleCancel = () => {
        setContent(comment.content)
        setError("")
        setIsEditing(false)
    }

    const handleUpdate = async () => {
        if (updateLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) {
            setError("Введите комментарий")
            return
        }

        if (normalizedContent.length > 2000) {
            setError("Комментарий не должен превышать 2000 символов")
            return
        }

        updateLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await updateComment({ commentId: comment.id, content: normalizedContent, username })

            if (result.success === false) {
                setError(result.error)
                return
            }

            setContent(result.comment.content)
            setUpdatedAt(result.comment.updated_at)
            setIsEditing(false)
        } catch (error) {
            console.error("COMMENT UPDATE ERROR:", error)
            setError("Не удалось изменить комментарий")
        } finally {
            updateLock.current = false
            setIsPending(false)
        }
    }

    const handleReply = async () => {
        if (replyLock.current) return

        const normalizedContent = replyContent.trim()

        if (!normalizedContent) return

        replyLock.current = true
        setIsReplyPending(true)
        setReplyError("")

        try {
            const result = await createComment({ postId, content: normalizedContent, username, parentId: comment.id })

            if (result.success === false) {
                setReplyError(result.error)
                return
            }

            const newReply: PostCommentNode = {
                ...result.comment,
                author: currentProfile,
                replies: []
            }

            setReplies((prev) => [...prev, newReply])
            setReplyContent("")

            if (replyTextareaRef.current) {
                replyTextareaRef.current.style.height = "36px"
                replyTextareaRef.current.style.overflowY = "hidden"
            }

            setIsReplying(false)
            onCommentCreated()
        } catch (error) {
            console.error("COMMENT REPLY ERROR:", error)
            setReplyError("Не удалось отправить ответ")
        } finally {
            replyLock.current = false
            setIsReplyPending(false)
        }
    }

    const handleLike = async () => {
        if (likeLock.current) return

        likeLock.current = true

        const previousLiked = isLiked
        const previousLikesCount = likesCount
        const nextLiked = !isLiked

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

    return (
        <div>
            <div className="flex items-start gap-3">
                <Link href={`/profile/${currentProfile.username}`} className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={comment.author?.avatar_url ?? "/user-avatar.svg"} alt={comment.author?.display_name ?? "Пользователь"} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-[#f4f7f4] px-3.5 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <Link href={`/profile/${currentProfile.username}`} className="min-w-0 truncate text-sm font-semibold">
                                {comment.author?.display_name ?? "Пользователь"}
                            </Link>

                            {comment.user_id === currentProfile.id && !isEditing && (
                                <CommentActions commentId={comment.id} postId={postId} username={username} onEdit={() => setIsEditing(true)} onDeleted={(commentCount) => { onRemove(comment.id); onCommentDeleted(commentCount) }} />
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mt-2">
                                <textarea value={content} onChange={(e) => { setContent(e.target.value); setError("") }} maxLength={2000} autoFocus className="min-h-[90] w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-main-green/40" />

                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-xs text-main-gray">
                                        {content.length}/2000
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button type="button" disabled={isPending} onClick={handleCancel} className="h-8 cursor-pointer rounded-lg border border-gray-200 px-3 text-xs transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                                            Отмена
                                        </button>

                                        <button type="button" disabled={isPending || !content.trim()} onClick={handleUpdate} className="h-8 cursor-pointer rounded-lg bg-main-green px-3 text-xs font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                                            {isPending ? "Сохраняем..." : "Сохранить"}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-5 text-gray-800">
                                {content}
                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-main-gray">
                            <span className="whitespace-nowrap">
                                {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(comment.created_at))}

                                {isEdited && (
                                    <>
                                        {" · "}
                                        <span title={`Изменено ${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(updatedAt))}`} className="cursor-default">
                                            изменено
                                        </span>
                                    </>
                                )}
                            </span>

                            <button type="button" onClick={handleLike} className={`cursor-pointer whitespace-nowrap font-medium transition-colors ${isLiked ? "text-main-green" : "hover:text-main-green"}`}>
                                Нравится&nbsp;({likesCount > 0 && `${likesCount}`})
                            </button>

                            <button type="button" onClick={() => { setIsReplying((prev) => !prev); setReplyError("") }} className="cursor-pointer whitespace-nowrap font-medium transition-colors hover:text-main-green">
                                Ответить
                            </button>
                        </div>
                    )}

                    {isReplying && (
                        <div className="mt-3">
                            <div className="flex items-end gap-2">
                                <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                    <Image src={currentProfile.avatar_url ?? "/user-avatar.svg"} alt={currentProfile.display_name} fill sizes="32px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                                </div>

                                <textarea ref={replyTextareaRef} value={replyContent} onChange={(e) => { setReplyContent(e.target.value); setReplyError(""); e.currentTarget.style.height = "36px"; const nextHeight = Math.min(e.currentTarget.scrollHeight, 120); e.currentTarget.style.height = `${nextHeight}px`; e.currentTarget.style.overflowY = e.currentTarget.scrollHeight > 120 ? "auto" : "hidden" }} placeholder="Ваш ответ..." maxLength={2000} rows={1} autoFocus className="min-h-9 max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden rounded-2xl border border-gray-100 bg-[#f4f7f4] px-3.5 py-2 text-sm leading-5 outline-none transition-colors placeholder:text-main-gray focus:border-main-green/30 focus:bg-white" />

                                <button type="button" onClick={handleReply} disabled={isReplyPending || !replyContent.trim()} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                                    <Send className="size-4" />
                                </button>
                            </div>

                            {replyError && (
                                <div className="mt-2 pl-10 text-xs text-red-600">
                                    {replyError}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {replies.length > 0 && (
                <div className={depth === 0 ? "ml-9 mt-2" : "mt-2"}>
                    <div className="flex flex-col gap-3">
                        {replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} postId={postId} username={username} currentProfile={currentProfile} initialLiked={likedCommentIds.includes(reply.id)} likedCommentIds={likedCommentIds} depth={depth + 1} onCommentCreated={onCommentCreated} onCommentDeleted={onCommentDeleted} onRemove={(commentId) => setReplies((prev) => prev.filter((item) => item.id !== commentId))} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CommentItem