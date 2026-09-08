"use client"

import { createComment } from "@/actions/createComment"
import { getPostComments } from "@/actions/getPostComments"
import type {
    CommentCursor,
    PagedPostComment
} from "@/types/postComments"
import type { Profile } from "@/types/social"
import { LoaderCircle, RefreshCw, Send } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import CommentItem from "./CommentItem"

type Props = {
    postId: string
    username: string
    currentProfile: Profile
    onCommentCreated: () => void
    onCommentDeleted: (commentCount: number) => void
    enabled: boolean
}

const COMMENTS_PAGE_SIZE = 20

function sortComments(
    left: PagedPostComment,
    right: PagedPostComment
) {
    const timeDifference =
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()

    if (timeDifference !== 0) return timeDifference

    return left.id.localeCompare(right.id)
}

function mergeComments(
    current: PagedPostComment[],
    incoming: PagedPostComment[]
) {
    const byId = new Map<string, PagedPostComment>()

    for (const comment of current) {
        byId.set(comment.id, comment)
    }

    for (const comment of incoming) {
        byId.set(comment.id, comment)
    }

    return Array.from(byId.values()).sort(sortComments)
}

function CommentsSection({
    currentProfile,
    onCommentCreated,
    onCommentDeleted,
    postId,
    username,
    enabled
}: Props) {
    const [comments, setComments] = useState<PagedPostComment[]>([])
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    const [loadError, setLoadError] = useState("")
    const [isPending, setIsPending] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<CommentCursor | null>(null)
    const [remainingCount, setRemainingCount] = useState(0)

    const submitLockRef = useRef(false)
    const loadLockRef = useRef(false)
    const hasLoadedRef = useRef(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const loadComments = useCallback(async (
        cursor: CommentCursor | null
    ) => {
        if (loadLockRef.current) return

        const loadingMore = cursor !== null

        loadLockRef.current = true
        setLoadError("")

        if (loadingMore) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
        }

        try {
            const result = await getPostComments({
                postId,
                cursor
            })

            if (result.success === false) {
                setLoadError(result.error)
                return
            }

            if (loadingMore) {
                setComments((current) =>
                    mergeComments(
                        current,
                        result.comments
                    )
                )
            } else {
                setComments(result.comments)
            }

            setNextCursor(result.nextCursor)
            setRemainingCount(result.remainingCount)
            hasLoadedRef.current = true
        } catch (loadCommentsError) {
            console.error(
                "POST COMMENTS LOAD ERROR:",
                loadCommentsError
            )

            setLoadError(
                "Не удалось загрузить комментарии"
            )
        } finally {
            loadLockRef.current = false
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [postId])

    useEffect(() => {
        if (!enabled || hasLoadedRef.current) return

        void loadComments(null)
    }, [enabled, loadComments])

    const handleSubmit = async () => {
        if (submitLockRef.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) return

        submitLockRef.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await createComment({
                content: normalizedContent,
                postId,
                username
            })

            if (result.success === false) {
                setError(result.error)
                return
            }

            const newComment: PagedPostComment = {
                ...result.comment,
                author: currentProfile,
                replies: [],
                replyCount: 0,
                repliesLoaded: true,
                initialLiked: false
            }

            setComments((current) =>
                mergeComments(
                    current,
                    [newComment]
                )
            )

            setContent("")

            if (textareaRef.current) {
                textareaRef.current.style.height = "40px"
                textareaRef.current.style.overflowY = "hidden"
            }

            onCommentCreated()
        } catch (submitError) {
            console.error(
                "COMMENT CREATE ERROR:",
                submitError
            )

            setError(
                "Не удалось добавить комментарий"
            )
        } finally {
            submitLockRef.current = false
            setIsPending(false)
        }
    }

    return (
        <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="flex items-end gap-2">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={currentProfile.avatar_url ?? "/user-avatar.svg"} alt={currentProfile.display_name} fill sizes="36px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(event) => {
                        setContent(event.target.value)
                        setError("")

                        event.currentTarget.style.height = "40px"

                        const nextHeight = Math.min(
                            event.currentTarget.scrollHeight,
                            120
                        )

                        event.currentTarget.style.height = `${nextHeight}px`
                        event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 120 ? "auto" : "hidden"
                    }}
                    placeholder="Комментарий..."
                    maxLength={2000}
                    rows={1}
                    className="min-h-10 max-h-[120] min-w-0 flex-1 resize-none overflow-y-hidden rounded-2xl border border-gray-100 bg-[#f4f7f4] px-3.5 py-2.5 text-sm leading-5 outline-none transition-colors placeholder:text-main-gray focus:border-main-green/30 focus:bg-white"
                />

                <button type="button" onClick={handleSubmit} disabled={isPending || !content.trim()} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
            </div>

            {error && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                </div>
            )}

            {isLoading && !hasLoadedRef.current && (
                <div className="flex min-h-24 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-main-gray">
                        <LoaderCircle className="size-4 animate-spin" />
                        <span>Загружаем комментарии...</span>
                    </div>
                </div>
            )}

            {!isLoading && loadError && !hasLoadedRef.current && (
                <div className="py-5 text-center">
                    <div className="text-sm text-red-500">
                        {loadError}
                    </div>

                    <button type="button" onClick={() => void loadComments(null)} className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-main-green hover:underline">
                        <RefreshCw className="size-4" />
                        <span>Попробовать снова</span>
                    </button>
                </div>
            )}

            {hasLoadedRef.current && comments.length === 0 && (
                <div className="py-5 text-center text-sm text-main-gray">
                    Комментариев пока нет
                </div>
            )}

            {hasLoadedRef.current && comments.length > 0 && (
                <>
                    <div className="mt-4 flex flex-col gap-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                                username={username}
                                currentProfile={currentProfile}
                                onCommentCreated={onCommentCreated}
                                onCommentDeleted={onCommentDeleted}
                                onRemove={(commentId) =>
                                    setComments((current) =>
                                        current.filter(
                                            (item) =>
                                                item.id !== commentId
                                        )
                                    )
                                }
                            />
                        ))}
                    </div>

                    {loadError && hasLoadedRef.current && (
                        <div className="mt-3 text-sm text-red-500">
                            {loadError}
                        </div>
                    )}

                    {nextCursor && remainingCount > 0 && (
                        <button type="button" disabled={isLoadingMore} onClick={() => void loadComments(nextCursor)} className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-main-gray transition-colors hover:text-main-green disabled:pointer-events-none disabled:opacity-60">
                            {isLoadingMore && <LoaderCircle className="size-4 animate-spin" />}
                            <span>
                                Показать ещё ({Math.min(COMMENTS_PAGE_SIZE, remainingCount)})
                            </span>
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

export default CommentsSection