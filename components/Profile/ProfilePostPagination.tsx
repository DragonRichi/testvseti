"use client"

import { loadMoreProfilePosts } from "@/actions/loadMoreProfilePosts"
import type { ProfilePostMode, ProfilePostsCursor } from "@/types/profileContent"
import type { Post, Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import PostCard from "./PostCard"

type Props = {
    profile: Profile
    currentProfile: Profile
    isOwnProfile: boolean
    initialPostIds: string[]
    initialCursor: ProfilePostsCursor | null
    mode: ProfilePostMode
}

function serializeCursor(
    cursor: ProfilePostsCursor | null
) {
    return JSON.stringify(
        cursor
    )
}

function ProfilePostPagination({
    profile,
    currentProfile,
    isOwnProfile,
    initialPostIds,
    initialCursor,
    mode
}: Props) {
    const [
        loadedPosts,
        setLoadedPosts
    ] = useState<Post[]>([])

    const [
        likedPostIds,
        setLikedPostIds
    ] = useState<string[]>([])

    const [
        cursor,
        setCursor
    ] =
        useState<ProfilePostsCursor | null>(
            initialCursor
        )

    const [
        isLoading,
        setIsLoading
    ] = useState(false)

    const [
        error,
        setError
    ] = useState("")

    const loadLockRef =
        useRef(false)

    const generationRef =
        useRef(0)

    const initialVersion =
        useMemo(
            () =>
                `${profile.id}:${mode}:${initialPostIds.join("|")}::${serializeCursor(initialCursor)}`,
            [
                profile.id,
                mode,
                initialPostIds,
                initialCursor
            ]
        )

    const appliedVersionRef =
        useRef(
            initialVersion
        )

    const initialIdSet =
        useMemo(
            () =>
                new Set(
                    initialPostIds
                ),
            [initialPostIds]
        )

    const visiblePosts =
        loadedPosts.filter(
            (post) =>
                !initialIdSet.has(
                    post.id
                )
        )

    useEffect(() => {
        if (
            appliedVersionRef.current ===
            initialVersion
        ) {
            return
        }

        appliedVersionRef.current =
            initialVersion

        generationRef.current += 1
        loadLockRef.current = false

        setLoadedPosts([])
        setLikedPostIds([])
        setCursor(
            initialCursor
        )
        setError("")
        setIsLoading(false)
    }, [
        initialCursor,
        initialVersion
    ])

    const handleLoadMore =
        async () => {
            if (
                loadLockRef.current ||
                !cursor
            ) {
                return
            }

            const requestCursor =
                cursor

            const generation =
                ++generationRef.current

            loadLockRef.current =
                true

            setIsLoading(true)
            setError("")

            try {
                const result =
                    await loadMoreProfilePosts(
                        profile.id,
                        requestCursor,
                        mode
                    )

                if (
                    generation !==
                    generationRef.current
                ) {
                    return
                }

                if (
                    result.success ===
                    false
                ) {
                    setError(
                        result.error
                    )
                    return
                }

                setLoadedPosts(
                    (current) => {
                        const ids =
                            new Set([
                                ...initialPostIds,
                                ...current.map(
                                    (
                                        post
                                    ) =>
                                        post.id
                                )
                            ])

                        const incoming =
                            result.posts.filter(
                                (
                                    post
                                ) =>
                                    !ids.has(
                                        post.id
                                    )
                            )

                        return [
                            ...current,
                            ...incoming
                        ]
                    }
                )

                setLikedPostIds(
                    (current) => [
                        ...new Set([
                            ...current,
                            ...result.likedPostIds
                        ])
                    ]
                )

                setCursor(
                    result.nextCursor
                )
            } catch (error) {
                console.error(
                    "PROFILE PAGINATION ERROR:",
                    error
                )

                setError(
                    "Не удалось загрузить данные"
                )
            } finally {
                if (
                    generation ===
                    generationRef.current
                ) {
                    loadLockRef.current =
                        false

                    setIsLoading(
                        false
                    )
                }
            }
        }

    const handleDeleted =
        useCallback(
            (
                postId: string
            ) => {
                setLoadedPosts(
                    (current) =>
                        current.filter(
                            (post) =>
                                post.id !==
                                postId
                        )
                )
            },
            []
        )

    return (
        <>
            {visiblePosts.map(
                (post) => (
                    <PostCard
                        key={post.id}
                        profile={
                            profile
                        }
                        post={post}
                        isOwnProfile={
                            isOwnProfile
                        }
                        initialLiked={likedPostIds.includes(
                            post.id
                        )}
                        currentProfile={
                            currentProfile
                        }
                        eagerMedia={
                            false
                        }
                        onDeleted={
                            handleDeleted
                        }
                    />
                )
            )}

            {error && (
                <div className="border-b border-[#e5e5e5] bg-white px-4 py-4 text-center text-sm text-red-500">
                    {error}
                </div>
            )}

            {cursor && (
                <div className="border-b border-[#e5e5e5] bg-white p-4">
                    <button
                        type="button"
                        onClick={() =>
                            void handleLoadMore()
                        }
                        disabled={
                            isLoading
                        }
                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f5f5f5] text-[13px] font-medium text-[#616161] transition-colors hover:bg-[#eeeeee] disabled:pointer-events-none disabled:opacity-60"
                    >
                        {isLoading && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}

                        {isLoading
                            ? "Загружаем..."
                            : "Показать ещё"}
                    </button>
                </div>
            )}
        </>
    )
}

export default ProfilePostPagination