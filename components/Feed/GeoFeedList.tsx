"use client"

import { loadMoreGeoFeed } from "@/actions/loadMoreGeoFeed"
import PostCard from "@/components/Profile/PostCard"
import type { GeoFeedCursor, GeoFeedItem } from "@/types/geoFeed"
import type { Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Props = {
    currentProfile: Profile
    initialItems: GeoFeedItem[]
    initialLikedCommentIds: string[]
    initialNextCursor: GeoFeedCursor | null
}

function GeoFeedList({ currentProfile, initialItems, initialLikedCommentIds, initialNextCursor }: Props) {
    const [items, setItems] = useState<GeoFeedItem[]>(initialItems)
    const [likedCommentIds, setLikedCommentIds] = useState<string[]>(initialLikedCommentIds)
    const [nextCursor, setNextCursor] = useState<GeoFeedCursor | null>(initialNextCursor)
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
        setIsLoading(false)
        loadingLock.current = false
    }, [initialItems, initialItemsVersion, initialLikedCommentIds, initialNextCursor])

    const loadMore = useCallback(async () => {
        if (!nextCursor || loadingLock.current) return

        loadingLock.current = true
        setIsLoading(true)
        setLoadError("")

        try {
            const result = await loadMoreGeoFeed(nextCursor)

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
            console.error("GEO FEED LOAD MORE ERROR:", error)
            setLoadError("Не удалось загрузить следующие публикации")
        } finally {
            loadingLock.current = false
            setIsLoading(false)
        }
    }, [nextCursor])

    useEffect(() => {
        if (!nextCursor || loadError) return

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
    }, [nextCursor, loadError, loadMore])

    return (
        <>
            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <PostCard key={item.post.id} post={item.post} profile={item.author} currentProfile={currentProfile} isOwnProfile={item.post.user_id === currentProfile.id} initialLiked={item.initialLiked} initialComments={item.initialComments} likedCommentIds={likedCommentIds} eagerMedia={index === 0} />
                ))}
            </div>

            {nextCursor && (
                <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center">
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-main-gray">
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Загружаем публикации...</span>
                        </div>
                    )}
                </div>
            )}

            {loadError && (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-red-100 bg-white p-4 text-center">
                    <div className="text-sm text-red-500">{loadError}</div>

                    <button type="button" onClick={() => { setLoadError(""); void loadMore() }} className="cursor-pointer rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-main-green transition-colors hover:bg-green-100">
                        Повторить
                    </button>
                </div>
            )}

            {!nextCursor && items.length >= 20 && (
                <div className="py-6 text-center text-xs text-main-gray">
                    Все публикации загружены
                </div>
            )}
        </>
    )
}

export default GeoFeedList