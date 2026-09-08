"use client"

import { getPostComments } from "@/actions/getPostComments"
import type {
    CommentCursor,
    PagedPostComment
} from "@/types/postComments"
import type { Profile } from "@/types/social"
import { LoaderCircle, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import CommentItem from "./CommentItem"
import PostCommentComposer from "./PostCommentComposer"

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
    const [loadError, setLoadError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<CommentCursor | null>(null)
    const [remainingCount, setRemainingCount] = useState(0)

    const loadLockRef = useRef(false)
    const hasLoadedRef = useRef(false)

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


    return (
        <div className="mt-3 border-t border-gray-100 pt-3">
            <PostCommentComposer
                postId={postId}
                username={username}
                currentProfile={currentProfile}
                onCreated={(newComment) => {
                    setComments((current) => mergeComments(current, [newComment]))
                    onCommentCreated()
                }}
            />

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