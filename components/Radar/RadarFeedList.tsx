"use client"

import { loadMoreRadarFeed } from "@/actions/loadMoreRadarFeed"
import PostCard from "@/components/Profile/PostCard"
import type { RadarFeedCursor, RadarFeedItem } from "@/types/radar"
import type { Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Props = {
    radarId: string
    currentProfile: Profile
    initialItems: RadarFeedItem[]
    initialLikedCommentIds: string[]
    initialNextCursor: RadarFeedCursor | null
    canPaginate: boolean
}

function RadarFeedList({ radarId, currentProfile, initialItems, initialLikedCommentIds, initialNextCursor, canPaginate }: Props) {
    const [items, setItems] = useState<RadarFeedItem[]>(initialItems)
    const [likedCommentIds, setLikedCommentIds] = useState<string[]>(initialLikedCommentIds)
    const [nextCursor, setNextCursor] = useState<RadarFeedCursor | null>(initialNextCursor)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [loadError, setLoadError] = useState<string>("")

    const loadMoreRef = useRef<HTMLDivElement>(null)
    const loadingLock = useRef(false)

    const initialItemsVersion = useMemo(() => initialItems.map((item) => item.post.id).join("|"), [initialItems])

    useEffect(() => {
        setItems(initialItems)
        setLikedCommentIds(initialLikedCommentIds)
        setNextCursor(initialNextCursor)
        setLoadError("")
        loadingLock.current = false
        setIsLoading(false)
    }, [radarId, initialItemsVersion])

    const loadMore = useCallback(async () => {
        if (!canPaginate || !nextCursor || loadingLock.current) return

        loadingLock.current = true
        setIsLoading(true)
        setLoadError("")

        try {
            const result = await loadMoreRadarFeed(radarId, nextCursor)

            if (result.success === false) {
                setLoadError(result.error)
                return
            }

            setItems((currentItems) => {
                const existingIds = new Set(currentItems.map((item) => item.post.id))
                const newItems = result.items.filter((item) => !existingIds.has(item.post.id))

                return [...currentItems, ...newItems]
            })

            setLikedCommentIds((currentIds) => Array.from(new Set([...currentIds, ...result.likedCommentIds])))
            setNextCursor(result.nextCursor)
        } catch (error) {
            console.error("RADAR LOAD MORE ERROR:", error)
            setLoadError("Не удалось загрузить следующие публикации")
        } finally {
            loadingLock.current = false
            setIsLoading(false)
        }
    }, [canPaginate, nextCursor, radarId])

    useEffect(() => {
        if (!canPaginate || !nextCursor || loadError) return

        const target = loadMoreRef.current

        if (!target) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                if (entry?.isIntersecting) {
                    void loadMore()
                }
            },
            {
                rootMargin: "600px 0px",
                threshold: 0
            }
        )

        observer.observe(target)

        return () => {
            observer.disconnect()
        }
    }, [canPaginate, nextCursor, loadError, loadMore])

    return (
        <>
            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <PostCard eagerMedia={index === 0} key={item.post.id} post={item.post} profile={item.author} currentProfile={currentProfile} isOwnProfile={item.post.user_id === currentProfile.id} initialLiked={item.initialLiked} initialComments={item.initialComments} likedCommentIds={likedCommentIds} />
                ))}
            </div>

            {canPaginate && nextCursor && (
                <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center">
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-main-gray">
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Загружаем публикации...</span>
                        </div>
                    )}
                </div>
            )}

            {canPaginate && loadError && (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-red-100 bg-white p-4 text-center">
                    <div className="text-sm text-red-500">{loadError}</div>

                    <button type="button" onClick={() => { setLoadError(""); void loadMore() }} className="cursor-pointer rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-main-green transition-colors hover:bg-green-100">
                        Повторить
                    </button>
                </div>
            )}

            {canPaginate && !nextCursor && items.length >= 20 && (
                <div className="py-6 text-center text-xs text-main-gray">
                    Все публикации загружены
                </div>
            )}
        </>
    )
}

export default RadarFeedList