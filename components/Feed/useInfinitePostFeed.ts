"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type ItemWithPost = {
    post: {
        id: string
    }
}

type PageResult<TItem, TCursor> =
    | { success: true; items: TItem[]; nextCursor: TCursor | null }
    | { success: false; error: string }

type Options<TItem extends ItemWithPost, TCursor> = {
    initialItems: TItem[]
    initialNextCursor: TCursor | null
    stateVersion: string
    loadPage: (cursor: TCursor) => Promise<PageResult<TItem, TCursor>>
    serializeCursor: (cursor: TCursor | null) => string
    enabled?: boolean
    rootMargin?: string
    stalledError?: string
}

export function useInfinitePostFeed<TItem extends ItemWithPost, TCursor>({
    initialItems,
    initialNextCursor,
    stateVersion,
    loadPage,
    serializeCursor,
    enabled = true,
    rootMargin = "250px 0px",
    stalledError = "Не удалось продолжить загрузку ленты"
}: Options<TItem, TCursor>) {
    const [items, setItems] = useState<TItem[]>(initialItems)
    const [nextCursor, setNextCursor] = useState<TCursor | null>(initialNextCursor)
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState("")
    const sentinelRef = useRef<HTMLDivElement>(null)
    const loadingLockRef = useRef(false)
    const requestGenerationRef = useRef(0)
    const appliedStateVersionRef = useRef(stateVersion)

    useEffect(() => {
        if (appliedStateVersionRef.current === stateVersion) return

        appliedStateVersionRef.current = stateVersion
        requestGenerationRef.current += 1
        loadingLockRef.current = false
        setItems(initialItems)
        setNextCursor(initialNextCursor)
        setLoadError("")
        setIsLoading(false)
    }, [initialItems, initialNextCursor, stateVersion])

    const loadMore = useCallback(async () => {
        if (!enabled || !nextCursor || loadingLockRef.current) return

        const cursorAtRequest = nextCursor
        const cursorVersion = serializeCursor(cursorAtRequest)
        const requestGeneration = ++requestGenerationRef.current

        loadingLockRef.current = true
        setIsLoading(true)
        setLoadError("")

        try {
            const result = await loadPage(cursorAtRequest)

            if (requestGeneration !== requestGenerationRef.current) return

            if (result.success === false) {
                setLoadError(result.error)
                return
            }

            if (result.nextCursor && serializeCursor(result.nextCursor) === cursorVersion) {
                console.error("INFINITE FEED CURSOR DID NOT ADVANCE")
                setLoadError(stalledError)
                return
            }

            setItems((currentItems) => {
                const existingIds = new Set(currentItems.map((item) => item.post.id))
                const newItems = result.items.filter((item) => !existingIds.has(item.post.id))
                return [...currentItems, ...newItems]
            })

            setNextCursor(result.nextCursor)
        } catch (error) {
            if (requestGeneration !== requestGenerationRef.current) return

            console.error("INFINITE FEED LOAD ERROR:", error)
            setLoadError("Не удалось загрузить следующие публикации")
        } finally {
            if (requestGeneration === requestGenerationRef.current) {
                loadingLockRef.current = false
                setIsLoading(false)
            }
        }
    }, [enabled, loadPage, nextCursor, serializeCursor, stalledError])

    useEffect(() => {
        if (!enabled || !nextCursor || loadError) return

        const target = sentinelRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void loadMore()
            },
            { rootMargin, threshold: 0 }
        )

        observer.observe(target)
        return () => observer.disconnect()
    }, [enabled, loadError, loadMore, nextCursor, rootMargin])

    const retry = useCallback(() => {
        if (!loadingLockRef.current) void loadMore()
    }, [loadMore])

    const removeItem = useCallback((postId: string) => {
        setItems((currentItems) => currentItems.filter((item) => item.post.id !== postId))
    }, [])

    return {
        items,
        nextCursor,
        isLoading,
        loadError,
        sentinelRef,
        retry,
        removeItem
    }
}
