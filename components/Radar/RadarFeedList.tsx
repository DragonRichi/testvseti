"use client"

import { loadMoreRadarFeed } from "@/actions/loadMoreRadarFeed"
import { useInfinitePostFeed } from "@/components/Feed/useInfinitePostFeed"
import PostCard from "@/components/Profile/PostCard"
import type { RadarFeedCursor, RadarFeedItem } from "@/types/radar"
import type { Profile } from "@/types/social"
import { LoaderCircle } from "lucide-react"
import { useCallback, useMemo } from "react"

type Props = {
    radarId: string
    currentProfile: Profile
    initialItems: RadarFeedItem[]
    initialNextCursor: RadarFeedCursor | null
    canPaginate: boolean
}

function RadarFeedList({ radarId, currentProfile, initialItems, initialNextCursor, canPaginate }: Props) {
    const serializeCursor = useCallback((cursor: RadarFeedCursor | null) => JSON.stringify(cursor), [])
    const loadPage = useCallback((cursor: RadarFeedCursor) => loadMoreRadarFeed(radarId, cursor), [radarId])
    const stateVersion = useMemo(
        () => `${radarId}:${initialItems.map((item) => item.post.id).join("|")}::${serializeCursor(initialNextCursor)}`,
        [initialItems, initialNextCursor, radarId, serializeCursor]
    )

    const { items, nextCursor, isLoading, loadError, sentinelRef, retry, removeItem } = useInfinitePostFeed({
        initialItems,
        initialNextCursor,
        stateVersion,
        loadPage,
        serializeCursor,
        enabled: canPaginate,
        rootMargin: "600px 0px",
        stalledError: "Не удалось продолжить загрузку радара"
    })

    return (
        <>
            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <PostCard key={item.post.id} eagerMedia={index === 0} post={item.post} profile={item.author} currentProfile={currentProfile} isOwnProfile={item.post.user_id === currentProfile.id} initialLiked={item.initialLiked} onDeleted={removeItem} />
                ))}
            </div>

            {canPaginate && nextCursor && (
                <div ref={sentinelRef} className="flex min-h-20 items-center justify-center">
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
                    <button type="button" onClick={retry} className="cursor-pointer rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-main-green transition-colors hover:bg-green-100">Повторить</button>
                </div>
            )}

            {canPaginate && !nextCursor && items.length >= 20 && <div className="py-6 text-center text-xs text-main-gray">Все публикации радара загружены</div>}
        </>
    )
}

export default RadarFeedList
