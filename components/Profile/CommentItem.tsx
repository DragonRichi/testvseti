"use client"

import { toggleCommentLike } from "@/actions/toggleCommentLike"
import UserAvatar from "@/components/ui/UserAvatar"
import type { PagedPostComment } from "@/types/postComments"
import type { Profile } from "@/types/social"
import { CornerUpLeft, Heart, LoaderCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"
import CommentActions from "./CommentActions"
import CommentEditForm from "./CommentEditForm"
import CommentReplyForm from "./CommentReplyForm"
import useCommentReplies from "./useCommentReplies"

type Props = {
    comment: PagedPostComment
    postId: string
    username: string
    currentProfile: Profile
    onCommentCreated: () => void
    onCommentDeleted: (commentCount: number) => void
    onRemove: (commentId: string) => void
    depth?: number
    replyToUsername?: string | null
}

const REPLIES_PAGE_SIZE = 20

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

function CommentItem({
    comment,
    postId,
    username,
    currentProfile,
    onCommentCreated,
    onCommentDeleted,
    onRemove,
    depth = 0,
    replyToUsername = null
}: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [content, setContent] = useState(comment.content)
    const [updatedAt, setUpdatedAt] = useState(comment.updated_at)
    const [isReplying, setIsReplying] = useState(false)
    const [isLiked, setIsLiked] = useState(comment.initialLiked)
    const [likesCount, setLikesCount] = useState(Number(comment.likes_count ?? 0))
    const likeLockRef = useRef(false)

    const {
        replies,
        replyCount,
        repliesLoaded,
        isRepliesOpen,
        isLoading: isRepliesLoading,
        error: repliesError,
        remainingCount,
        hasMore,
        toggleReplies,
        loadMore,
        retry,
        addReply,
        removeReply
    } = useCommentReplies(comment, postId)

    const authorUsername = comment.author?.username ?? null
    const authorName = comment.author?.display_name ?? "Пользователь"

    const isEdited =
        new Date(updatedAt).getTime() >
        new Date(comment.created_at).getTime() + 1000

    const handleLike = async () => {
        if (likeLockRef.current) return

        likeLockRef.current = true

        const previousLiked = isLiked
        const previousLikesCount = likesCount
        const nextLiked = !previousLiked

        setIsLiked(nextLiked)
        setLikesCount(
            Math.max(
                0,
                previousLikesCount + (nextLiked ? 1 : -1)
            )
        )

        try {
            const result = await toggleCommentLike({
                commentId: comment.id,
                username
            })

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
            likeLockRef.current = false
        }
    }

    return (
        <div>
            <div className="flex items-start gap-2.5">
                {authorUsername ? (
                    <Link href={`/profile/${authorUsername}`} className="shrink-0 rounded-full">
                        <UserAvatar
                            userId={comment.user_id}
                            displayName={authorName}
                            avatarUrl={comment.author?.avatar_url}
                            size={36}
                        />
                    </Link>
                ) : (
                    <UserAvatar
                        userId={comment.user_id}
                        displayName={authorName}
                        avatarUrl={comment.author?.avatar_url}
                        size={36}
                    />
                )}

                <div className="min-w-0 flex-1">
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                            {authorUsername ? (
                                <Link href={`/profile/${authorUsername}`} className="min-w-0 truncate text-sm font-semibold text-[#171717] hover:underline">
                                    {authorName}
                                </Link>
                            ) : (
                                <span className="min-w-0 truncate text-sm font-semibold text-[#171717]">
                                    {authorName}
                                </span>
                            )}

                            {authorUsername && (
                                <span className="hidden min-w-0 truncate text-xs text-[#999] sm:block">
                                    @{authorUsername}
                                </span>
                            )}

                            <span className="shrink-0 text-xs text-[#aaa]">
                                · {COMMENT_DATE_FORMATTER.format(new Date(comment.created_at))}
                            </span>

                            {isEdited && (
                                <span
                                    title={`Изменено ${EDITED_DATE_FORMATTER.format(new Date(updatedAt))}`}
                                    className="shrink-0 text-xs text-[#aaa]"
                                >
                                    · изменено
                                </span>
                            )}

                            {comment.user_id === currentProfile.id && !isEditing && (
                                <div className="ml-auto shrink-0">
                                    <CommentActions
                                        commentId={comment.id}
                                        postId={postId}
                                        username={username}
                                        onEdit={() => setIsEditing(true)}
                                        onDeleted={(commentCount) => {
                                            onRemove(comment.id)
                                            onCommentDeleted(commentCount)
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {replyToUsername && !isEditing && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-[#999]">
                                <CornerUpLeft className="size-3.5 shrink-0" strokeWidth={1.6} />

                                <span>Ответ</span>

                                <Link href={`/profile/${replyToUsername}`} className="font-medium text-main-green hover:underline">
                                    @{replyToUsername}
                                </Link>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="mt-2">
                                <CommentEditForm
                                    commentId={comment.id}
                                    username={username}
                                    initialContent={content}
                                    onCancel={() => setIsEditing(false)}
                                    onSaved={(nextContent, nextUpdatedAt) => {
                                        setContent(nextContent)
                                        setUpdatedAt(nextUpdatedAt)
                                        setIsEditing(false)
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#303030]">
                                {content}
                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-[#888]">
                            <button
                                type="button"
                                onClick={() => void handleLike()}
                                aria-label="Нравится"
                                className={`flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 transition-colors ${isLiked ? "bg-[#ebf9ed] text-main-green" : "hover:bg-[#f4f4f4] hover:text-[#333]"}`}
                            >
                                <Heart className={`size-4 ${isLiked ? "fill-main-green" : ""}`} strokeWidth={1.7} />

                                {likesCount > 0 && (
                                    <span>{likesCount}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsReplying(
                                        (current) => !current
                                    )
                                }
                                className={`flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium transition-colors ${isReplying ? "bg-[#ebf9ed] text-main-green" : "hover:bg-[#f4f4f4] hover:text-[#333]"}`}
                            >
                                <CornerUpLeft className="size-3.5" strokeWidth={1.6} />
                                Ответить
                            </button>

                            {replyCount > 0 && (replyCount > 3 || !repliesLoaded) && (
                                <button
                                    type="button"
                                    onClick={toggleReplies}
                                    className="ml-1 cursor-pointer rounded-lg px-2 py-1 font-medium text-main-green transition-colors hover:bg-[#eef9f1]"
                                >
                                    {isRepliesOpen
                                        ? "Скрыть ответы"
                                        : `Ответы ${replyCount}`}
                                </button>
                            )}
                        </div>
                    )}

                    {isReplying && (
                        <div className="mt-2">
                            <CommentReplyForm
                                postId={postId}
                                parentCommentId={comment.id}
                                username={username}
                                replyToUsername={authorUsername}
                                currentProfile={currentProfile}
                                onCancel={() => setIsReplying(false)}
                                onCreated={(newReply) => {
                                    addReply(newReply)
                                    setIsReplying(false)
                                    onCommentCreated()
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {isRepliesOpen && (
                <div className={depth === 0 ? "ml-4 mt-2 border-l border-[#e8e8e8] pl-4" : "mt-2"}>
                    {isRepliesLoading && replies.length === 0 && (
                        <div className="flex items-center gap-2 py-2 text-xs text-[#999]">
                            <LoaderCircle className="size-3.5 animate-spin" />
                            <span>Загружаем ответы...</span>
                        </div>
                    )}

                    {replies.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    postId={postId}
                                    username={username}
                                    currentProfile={currentProfile}
                                    depth={depth + 1}
                                    replyToUsername={comment.author?.username ?? null}
                                    onCommentCreated={onCommentCreated}
                                    onCommentDeleted={onCommentDeleted}
                                    onRemove={removeReply}
                                />
                            ))}
                        </div>
                    )}

                    {repliesError && (
                        <div className="mt-2">
                            <div className="text-xs text-red-500">
                                {repliesError}
                            </div>

                            <button
                                type="button"
                                onClick={retry}
                                className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-main-green hover:underline"
                            >
                                <RefreshCw className="size-3.5" />
                                Повторить
                            </button>
                        </div>
                    )}

                    {hasMore && remainingCount > 0 && (
                        <button
                            type="button"
                            disabled={isRepliesLoading}
                            onClick={loadMore}
                            className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-main-green transition-colors hover:bg-[#eef9f1] disabled:pointer-events-none disabled:opacity-60"
                        >
                            {isRepliesLoading && (
                                <LoaderCircle className="size-3.5 animate-spin" />
                            )}

                            Показать ещё ({Math.min(REPLIES_PAGE_SIZE, remainingCount)})
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default CommentItem