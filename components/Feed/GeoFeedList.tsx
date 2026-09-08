"use client"

import { loadMoreGeoFeed } from "@/actions/loadMoreGeoFeed"
import { useInfinitePostFeed } from "@/components/Feed/useInfinitePostFeed"
import PostCard from "@/components/Profile/PostCard"
import type { GeoFeedCursor, GeoFeedItem } from "@/types/geoFeed"
import type { Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useCallback, useMemo } from "react"

type Props = {
    currentProfile: Profile
    initialItems: GeoFeedItem[]
    initialNextCursor: GeoFeedCursor | null
}

function GeoFeedList({ currentProfile, initialItems, initialNextCursor }: Props) {
    const serializeCursor = useCallback((cursor: GeoFeedCursor | null) => JSON.stringify(cursor), [])
    const stateVersion = useMemo(
        () => `${initialItems.map((item) => item.post.id).join("|")}::${serializeCursor(initialNextCursor)}`,
        [initialItems, initialNextCursor, serializeCursor]
    )

    const { items, nextCursor, isLoading, loadError, sentinelRef, retry, removeItem } = useInfinitePostFeed({
        initialItems,
        initialNextCursor,
        stateVersion,
        loadPage: loadMoreGeoFeed,
        serializeCursor,
        rootMargin: "250px 0px",
        stalledError: "Не удалось продолжить загрузку GEO-ленты"
    })

    return (
        <>
            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <PostCard key={item.post.id} post={item.post} profile={item.author} currentProfile={currentProfile} isOwnProfile={item.post.user_id === currentProfile.id} initialLiked={item.initialLiked} eagerMedia={index === 0} onDeleted={removeItem} />
                ))}
            </div>

            {nextCursor && (
                <div ref={sentinelRef} className="flex min-h-20 items-center justify-center">
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
                    <button type="button" onClick={retry} className="cursor-pointer rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-main-green transition-colors hover:bg-green-100">Повторить</button>
                </div>
            )}

            {!nextCursor && items.length >= 20 && <div className="py-6 text-center text-xs text-main-gray">Все публикации загружены</div>}
        </>
    )
}

export default GeoFeedList
