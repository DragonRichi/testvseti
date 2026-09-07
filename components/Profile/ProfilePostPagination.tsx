"use client"

import { loadMoreProfilePosts } from "@/actions/loadMoreProfilePosts"
import type { Post, Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import PostCard from "./PostCard"

type Props = {
    profile: Profile
    currentProfile: Profile
    isOwnProfile: boolean
    initialPostIds: string[]
    totalPosts: number
}

function ProfilePostPagination({ profile, currentProfile, isOwnProfile, initialPostIds, totalPosts }: Props) {
    const [loadedPosts, setLoadedPosts] = useState<Post[]>([])
    const [likedPostIds, setLikedPostIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const loadLockRef = useRef(false)
    const previousTotalPostsRef = useRef(totalPosts)
    const initialPostIdSet = useMemo(() => new Set(initialPostIds), [initialPostIds])
    const visibleLoadedPosts = loadedPosts.filter((post) => !initialPostIdSet.has(post.id))
    const displayedPostsCount = initialPostIds.length + visibleLoadedPosts.length
    const hasMore = displayedPostsCount < totalPosts

    useEffect(() => {
        if (totalPosts < previousTotalPostsRef.current) {
            setLoadedPosts([])
            setLikedPostIds([])
            setError("")
        }

        previousTotalPostsRef.current = totalPosts
    }, [totalPosts])

    const handleLoadMore = async () => {
        if (loadLockRef.current || !hasMore) return

        loadLockRef.current = true
        setIsLoading(true)
        setError("")

        try {
            const result = await loadMoreProfilePosts(profile.id, displayedPostsCount)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setLoadedPosts((current) => {
                const existingIds = new Set(current.map((post) => post.id))
                const nextPosts = result.posts.filter((post) => !existingIds.has(post.id))

                return [...current, ...nextPosts]
            })

            setLikedPostIds((current) => [...new Set([...current, ...result.likedPostIds])])
        } catch (error) {
            console.error("PROFILE POSTS LOAD MORE ERROR:", error)
            setError("Не удалось загрузить публикации")
        } finally {
            loadLockRef.current = false
            setIsLoading(false)
        }
    }

    if (visibleLoadedPosts.length === 0 && !hasMore && !error) return null

    return (
        <>
            {visibleLoadedPosts.map((post) => (
                <PostCard key={post.id} profile={profile} post={post} isOwnProfile={isOwnProfile} initialLiked={likedPostIds.includes(post.id)} currentProfile={currentProfile} eagerMedia={false} />
            ))}

            {error && <div className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-center text-sm text-red-600">{error}</div>}

            {hasMore && (
                <button type="button" onClick={() => void handleLoadMore()} disabled={isLoading} className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-green-100 bg-white text-sm font-medium text-main-green transition-colors hover:bg-green-50 disabled:cursor-wait disabled:opacity-60">
                    {isLoading && <LoaderCircle className="size-4 animate-spin" />}
                    <span>{isLoading ? "Загружаем..." : "Показать ещё"}</span>
                </button>
            )}
        </>
    )
}

export default ProfilePostPagination