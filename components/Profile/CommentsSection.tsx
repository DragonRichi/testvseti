"use client"

import { getPostComments } from "@/actions/getPostComments"
import type {
    CommentCursor,
    PagedPostComment
} from "@/types/postComments"
import type { Profile } from "@/types/social"
import { LoaderCircle, RefreshCw } from "lucide-react"
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"
import CommentItem from "./CommentItem"
import {
    getCachedPostComments,
    invalidatePostComments,
    loadInitialPostComments
} from "./postCommentsPreload"
import PostCommentComposer from "./PostCommentComposer"

type Props = {
    postId: string
    username: string
    currentProfile: Profile
    onCommentCreated: () => void
    onCommentDeleted: (
        commentCount: number
    ) => void
    enabled: boolean
}

const COMMENTS_PAGE_SIZE = 20

function sortComments(
    left: PagedPostComment,
    right: PagedPostComment
) {
    const timeDifference =
        new Date(
            left.created_at
        ).getTime() -
        new Date(
            right.created_at
        ).getTime()

    if (timeDifference !== 0) {
        return timeDifference
    }

    return left.id.localeCompare(
        right.id
    )
}

function mergeComments(
    current: PagedPostComment[],
    incoming: PagedPostComment[]
) {
    const byId =
        new Map<
            string,
            PagedPostComment
        >()

    for (
        const comment of current
    ) {
        byId.set(
            comment.id,
            comment
        )
    }

    for (
        const comment of incoming
    ) {
        byId.set(
            comment.id,
            comment
        )
    }

    return Array.from(
        byId.values()
    ).sort(sortComments)
}

function CommentsSection({
    currentProfile,
    onCommentCreated,
    onCommentDeleted,
    postId,
    username,
    enabled
}: Props) {
    const cached =
        getCachedPostComments(
            postId
        )

    const [
        comments,
        setComments
    ] = useState<
        PagedPostComment[]
    >(
        () =>
            cached?.comments ??
            []
    )

    const [
        loadError,
        setLoadError
    ] = useState("")

    const [
        isLoadingMore,
        setIsLoadingMore
    ] = useState(false)

    const [
        nextCursor,
        setNextCursor
    ] =
        useState<CommentCursor | null>(
            () =>
                cached?.nextCursor ??
                null
        )

    const [
        remainingCount,
        setRemainingCount
    ] = useState(
        () =>
            cached?.remainingCount ??
            0
    )

    const loadLockRef =
        useRef(false)

    const hasLoadedRef =
        useRef(
            Boolean(cached)
        )

    const loadInitial =
        useCallback(async () => {
            if (
                loadLockRef.current ||
                hasLoadedRef.current
            ) {
                return
            }

            loadLockRef.current =
                true

            setLoadError("")

            try {
                const result =
                    await loadInitialPostComments(
                        postId
                    )

                if (
                    result.success ===
                    false
                ) {
                    setLoadError(
                        result.error
                    )

                    return
                }

                setComments(
                    result.data.comments
                )

                setNextCursor(
                    result.data.nextCursor
                )

                setRemainingCount(
                    result.data.remainingCount
                )

                hasLoadedRef.current =
                    true
            } finally {
                loadLockRef.current =
                    false
            }
        }, [postId])

    const loadMore =
        useCallback(async () => {
            if (
                loadLockRef.current ||
                !nextCursor
            ) {
                return
            }

            const cursor =
                nextCursor

            loadLockRef.current =
                true

            setIsLoadingMore(true)
            setLoadError("")

            try {
                const result =
                    await getPostComments({
                        postId,
                        cursor
                    })

                if (
                    result.success ===
                    false
                ) {
                    setLoadError(
                        result.error
                    )

                    return
                }

                setComments(
                    (current) =>
                        mergeComments(
                            current,
                            result.comments
                        )
                )

                setNextCursor(
                    result.nextCursor
                )

                setRemainingCount(
                    result.remainingCount
                )
            } catch (error) {
                console.error(
                    "POST COMMENTS LOAD MORE ERROR:",
                    error
                )

                setLoadError(
                    "Не удалось загрузить комментарии"
                )
            } finally {
                loadLockRef.current =
                    false

                setIsLoadingMore(false)
            }
        }, [
            nextCursor,
            postId
        ])

    useEffect(() => {
        if (
            !enabled ||
            hasLoadedRef.current
        ) {
            return
        }

        void loadInitial()
    }, [
        enabled,
        loadInitial
    ])

    const handleDeleted = (
        commentCount: number
    ) => {
        invalidatePostComments(
            postId
        )

        onCommentDeleted(
            commentCount
        )
    }

    return (
        <div className="mt-3 border-t border-[#ededed] pt-4">
            <PostCommentComposer
                postId={postId}
                username={username}
                currentProfile={
                    currentProfile
                }
                onCreated={(
                    newComment
                ) => {
                    setComments(
                        (current) =>
                            mergeComments(
                                current,
                                [
                                    newComment
                                ]
                            )
                    )

                    hasLoadedRef.current =
                        true

                    invalidatePostComments(
                        postId
                    )

                    onCommentCreated()
                }}
            />

            {loadError &&
                !hasLoadedRef.current && (
                    <div className="py-4 text-center">
                        <div className="text-sm text-red-500">
                            {
                                loadError
                            }
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void loadInitial()
                            }
                            className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-main-green hover:underline"
                        >
                            <RefreshCw className="size-4" />
                            Повторить
                        </button>
                    </div>
                )}

            {hasLoadedRef.current &&
                comments.length ===
                0 && (
                    <div className="py-4 text-center text-sm text-main-gray">
                        Комментариев пока нет
                    </div>
                )}

            {comments.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                    {comments.map(
                        (comment) => (
                            <CommentItem
                                key={
                                    comment.id
                                }
                                comment={
                                    comment
                                }
                                postId={
                                    postId
                                }
                                username={
                                    username
                                }
                                currentProfile={
                                    currentProfile
                                }
                                onCommentCreated={
                                    onCommentCreated
                                }
                                onCommentDeleted={
                                    handleDeleted
                                }
                                onRemove={(
                                    commentId
                                ) =>
                                    setComments(
                                        (
                                            current
                                        ) =>
                                            current.filter(
                                                (
                                                    item
                                                ) =>
                                                    item.id !==
                                                    commentId
                                            )
                                    )
                                }
                            />
                        )
                    )}
                </div>
            )}

            {loadError &&
                hasLoadedRef.current && (
                    <div className="mt-3 text-sm text-red-500">
                        {loadError}
                    </div>
                )}

            {nextCursor &&
                remainingCount > 0 && (
                    <button
                        type="button"
                        disabled={
                            isLoadingMore
                        }
                        onClick={() =>
                            void loadMore()
                        }
                        className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-main-gray transition-colors hover:text-main-green disabled:pointer-events-none disabled:opacity-60"
                    >
                        {isLoadingMore && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}

                        <span>
                            Показать ещё (
                            {Math.min(
                                COMMENTS_PAGE_SIZE,
                                remainingCount
                            )}
                            )
                        </span>
                    </button>
                )}
        </div>
    )
}

export default CommentsSection