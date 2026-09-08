"use client"

import { loadMoreProfilePosts, type ProfilePostsCursor } from "@/actions/loadMoreProfilePosts"
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
}

function serializeCursor(cursor: ProfilePostsCursor | null) {
    return JSON.stringify(cursor)
}

function ProfilePostPagination({ profile, currentProfile, isOwnProfile, initialPostIds, initialCursor }: Props) {
    const [loadedPosts, setLoadedPosts] = useState<Post[]>([])
    const [likedPostIds, setLikedPostIds] = useState<string[]>([])
    const [cursor, setCursor] = useState<ProfilePostsCursor | null>(initialCursor)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const loadLockRef = useRef(false)
    const requestGenerationRef = useRef(0)

    const initialVersion = useMemo(
        () => `${profile.id}:${initialPostIds.join("|")}::${serializeCursor(initialCursor)}`,
        [initialCursor, initialPostIds, profile.id]
    )
    const appliedInitialVersionRef = useRef(initialVersion)
    const initialPostIdSet = useMemo(() => new Set(initialPostIds), [initialPostIds])
    const visibleLoadedPosts = loadedPosts.filter((post) => !initialPostIdSet.has(post.id))

    useEffect(() => {
        if (appliedInitialVersionRef.current === initialVersion) return

        appliedInitialVersionRef.current = initialVersion
        requestGenerationRef.current += 1
        loadLockRef.current = false
        setLoadedPosts([])
        setLikedPostIds([])
        setCursor(initialCursor)
        setError("")
        setIsLoading(false)
    }, [initialCursor, initialVersion])

    const handleLoadMore = async () => {
        if (loadLockRef.current || !cursor) return

        const cursorAtRequest = cursor
        const requestGeneration = ++requestGenerationRef.current

        loadLockRef.current = true
        setIsLoading(true)
        setError("")

        try {
            const result = await loadMoreProfilePosts(profile.id, cursorAtRequest)

            if (requestGeneration !== requestGenerationRef.current) return

            if (result.success === false) {
                setError(result.error)
                return
            }

            if (result.nextCursor && serializeCursor(result.nextCursor) === serializeCursor(cursorAtRequest)) {
                console.error("PROFILE POSTS CURSOR DID NOT ADVANCE")
                setError("Не удалось продолжить загрузку публикаций")
                return
            }

            setLoadedPosts((current) => {
                const existingIds = new Set([...initialPostIds, ...current.map((post) => post.id)])
                const nextPosts = result.posts.filter((post) => !existingIds.has(post.id))
                return [...current, ...nextPosts]
            })
            setLikedPostIds((current) => [...new Set([...current, ...result.likedPostIds])])
            setCursor(result.nextCursor)
        } catch (loadError) {
            if (requestGeneration !== requestGenerationRef.current) return

            console.error("PROFILE POSTS LOAD MORE ERROR:", loadError)
            setError("Не удалось загрузить публикации")
        } finally {
            if (requestGeneration === requestGenerationRef.current) {
                loadLockRef.current = false
                setIsLoading(false)
            }
        }
    }

    const handlePostDeleted = useCallback((postId: string) => {
        setLoadedPosts((current) => current.filter((post) => post.id !== postId))
        setLikedPostIds((current) => current.filter((id) => id !== postId))
    }, [])

    if (visibleLoadedPosts.length === 0 && !cursor && !error) return null

    return (
        <>
            {visibleLoadedPosts.map((post) => (
                <PostCard key={post.id} profile={profile} post={post} isOwnProfile={isOwnProfile} initialLiked={likedPostIds.includes(post.id)} currentProfile={currentProfile} eagerMedia={false} onDeleted={handlePostDeleted} />
            ))}

            {error && <div className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-center text-sm text-red-600">{error}</div>}

            {cursor && (
                <button type="button" onClick={() => void handleLoadMore()} disabled={isLoading} className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-green-100 bg-white text-sm font-medium text-main-green transition-colors hover:bg-green-50 disabled:cursor-wait disabled:opacity-60">
                    {isLoading && <LoaderCircle className="size-4 animate-spin" />}
                    <span>{isLoading ? "Загружаем..." : "Показать ещё"}</span>
                </button>
            )}
        </>
    )
}

export default ProfilePostPagination
