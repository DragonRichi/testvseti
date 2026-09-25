"use client"

import { getPostComments } from "@/actions/getPostComments"
import type {
    CommentCursor,
    PagedPostComment
} from "@/types/postComments"

export type InitialPostComments = {
    comments: PagedPostComment[]
    nextCursor: CommentCursor | null
    remainingCount: number
}

type LoadResult =
    | {
        success: true
        data: InitialPostComments
    }
    | {
        success: false
        error: string
    }

type CacheEntry = {
    data: InitialPostComments
    expiresAt: number
}

const CACHE_TTL = 2 * 60 * 1000

const cache =
    new Map<string, CacheEntry>()

const pending =
    new Map<
        string,
        Promise<LoadResult>
    >()

export function getCachedPostComments(
    postId: string
) {
    const entry =
        cache.get(postId)

    if (!entry) {
        return null
    }

    if (
        entry.expiresAt <
        Date.now()
    ) {
        cache.delete(postId)
        return null
    }

    return entry.data
}

export async function loadInitialPostComments(
    postId: string
): Promise<LoadResult> {
    const cached =
        getCachedPostComments(
            postId
        )

    if (cached) {
        return {
            success: true,
            data: cached
        }
    }

    const existingRequest =
        pending.get(postId)

    if (existingRequest) {
        return existingRequest
    }

    const request =
        getPostComments({
            postId,
            cursor: null
        })
            .then(
                (
                    result
                ): LoadResult => {
                    if (
                        result.success ===
                        false
                    ) {
                        return {
                            success: false,
                            error:
                                result.error
                        }
                    }

                    const data: InitialPostComments =
                        {
                            comments:
                                result.comments,
                            nextCursor:
                                result.nextCursor,
                            remainingCount:
                                result.remainingCount
                        }

                    cache.set(
                        postId,
                        {
                            data,
                            expiresAt:
                                Date.now() +
                                CACHE_TTL
                        }
                    )

                    return {
                        success: true,
                        data
                    }
                }
            )
            .catch(
                (error): LoadResult => {
                    console.error(
                        "POST COMMENTS PRELOAD ERROR:",
                        error
                    )

                    return {
                        success: false,
                        error: "Не удалось загрузить комментарии"
                    }
                }
            )
            .finally(() => {
                pending.delete(
                    postId
                )
            })

    pending.set(
        postId,
        request
    )

    return request
}

export function invalidatePostComments(
    postId: string
) {
    cache.delete(postId)
}