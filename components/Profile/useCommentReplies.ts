"use client"

import { getCommentReplies } from "@/actions/getCommentReplies"
import type {
    CommentCursor,
    PagedPostComment
} from "@/types/postComments"
import type { PostCommentNode } from "@/types/social"
import { useCallback, useRef, useState } from "react"

const AUTO_SHOW_REPLIES_COUNT = 3

function sortComments(
    left: PagedPostComment,
    right: PagedPostComment
) {
    const timeDifference =
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()

    if (timeDifference !== 0) {
        return timeDifference
    }

    return left.id.localeCompare(right.id)
}

function mergeComments(
    current: PagedPostComment[],
    incoming: PagedPostComment[]
) {
    const commentsById =
        new Map<string, PagedPostComment>()

    for (const comment of current) {
        commentsById.set(
            comment.id,
            comment
        )
    }

    for (const comment of incoming) {
        commentsById.set(
            comment.id,
            comment
        )
    }

    return Array.from(
        commentsById.values()
    ).sort(sortComments)
}

export default function useCommentReplies(
    comment: PagedPostComment,
    postId: string
) {
    const [replies, setReplies] =
        useState<PagedPostComment[]>(
            comment.replies
        )

    const [replyCount, setReplyCount] =
        useState(comment.replyCount)

    const [repliesLoaded, setRepliesLoaded] =
        useState(comment.repliesLoaded)

    const [isRepliesOpen, setIsRepliesOpen] =
        useState(
            comment.replyCount > 0 &&
            comment.replyCount <=
                AUTO_SHOW_REPLIES_COUNT &&
            comment.repliesLoaded
        )

    const [nextCursor, setNextCursor] =
        useState<CommentCursor | null>(null)

    const [
        remainingCount,
        setRemainingCount
    ] = useState(
        comment.repliesLoaded
            ? Math.max(
                0,
                comment.replyCount -
                    comment.replies.length
            )
            : comment.replyCount
    )

    const [isLoading, setIsLoading] =
        useState(false)

    const [error, setError] =
        useState("")

    const loadLockRef = useRef(false)

    const loadReplies = useCallback(
        async (
            cursor: CommentCursor | null
        ) => {
            if (loadLockRef.current) return

            loadLockRef.current = true
            setIsLoading(true)
            setError("")

            try {
                const result =
                    await getCommentReplies({
                        postId,
                        parentCommentId:
                            comment.id,
                        cursor
                    })

                if (
                    result.success === false
                ) {
                    setError(result.error)
                    return
                }

                setReplies((current) =>
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

                setRepliesLoaded(true)
                setIsRepliesOpen(true)

                if (!cursor) {
                    setReplyCount(
                        result.comments.length +
                            result.remainingCount
                    )
                }
            } catch (loadError) {
                console.error(
                    "COMMENT REPLIES CLIENT LOAD ERROR:",
                    loadError
                )

                setError(
                    "Не удалось загрузить ответы"
                )
            } finally {
                loadLockRef.current = false
                setIsLoading(false)
            }
        },
        [comment.id, postId]
    )

    const toggleReplies = () => {
        if (isRepliesOpen) {
            setIsRepliesOpen(false)
            return
        }

        setIsRepliesOpen(true)

        if (!repliesLoaded) {
            void loadReplies(null)
        }
    }

    const loadMore = () => {
        if (!nextCursor) return

        void loadReplies(nextCursor)
    }

    const retry = () => {
        if (
            repliesLoaded &&
            nextCursor
        ) {
            void loadReplies(nextCursor)
            return
        }

        void loadReplies(null)
    }

    const addReply = (
        newReply: PostCommentNode
    ) => {
        const pagedReply: PagedPostComment = {
            ...newReply,
            replies: [],
            replyCount: 0,
            repliesLoaded: true,
            initialLiked: false
        }

        setReplies((current) =>
            mergeComments(
                current,
                [pagedReply]
            )
        )

        setReplyCount(
            (current) => current + 1
        )

        setIsRepliesOpen(true)

        if (!repliesLoaded) {
            void loadReplies(null)
        }
    }

    const removeReply = (
        commentId: string
    ) => {
        setReplies((current) =>
            current.filter(
                (reply) =>
                    reply.id !== commentId
            )
        )

        setReplyCount((current) =>
            Math.max(0, current - 1)
        )
    }

    return {
        replies,
        replyCount,
        repliesLoaded,
        isRepliesOpen,
        isLoading,
        error,
        remainingCount,
        hasMore: Boolean(nextCursor),
        toggleReplies,
        loadMore,
        retry,
        addReply,
        removeReply
    }
}