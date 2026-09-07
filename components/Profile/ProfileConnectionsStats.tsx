"use client"

import { getProfileConnections } from "@/actions/getProfileConnections"
import FollowButton from "@/components/Profile/FollowButton"
import type { ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"
import { LoaderCircle, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Props = {
    profileId: string
    subscriberCount: number
    followingCount: number
}

function appendUniqueItems(current: ProfileConnectionItem[], next: ProfileConnectionItem[]) {
    const existingIds = new Set(current.map((item) => item.id))

    return [...current, ...next.filter((item) => !existingIds.has(item.id))]
}

function ProfileConnectionsStats({ profileId, subscriberCount, followingCount }: Props) {
    const [openType, setOpenType] = useState<ProfileConnectionType | null>(null)
    const [items, setItems] = useState<ProfileConnectionItem[]>([])
    const [nextOffset, setNextOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState("")
    const loadLockRef = useRef(false)

    useEffect(() => {
        if (!openType) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenType(null)
        }

        const previousOverflow = document.body.style.overflow

        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [openType])

    const handleOpen = async (type: ProfileConnectionType) => {
        if (loadLockRef.current) return

        setOpenType(type)
        setItems([])
        setNextOffset(0)
        setHasMore(false)
        setError("")
        setIsLoading(true)
        loadLockRef.current = true

        try {
            const result = await getProfileConnections(profileId, type, 0)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setItems(result.items)
            setHasMore(result.hasMore)
            setNextOffset(result.nextOffset)
        } catch (error) {
            console.error("PROFILE CONNECTIONS ERROR:", error)
            setError("Не удалось загрузить список")
        } finally {
            loadLockRef.current = false
            setIsLoading(false)
        }
    }

    const handleLoadMore = async () => {
        if (!openType || loadLockRef.current || !hasMore) return

        loadLockRef.current = true
        setIsLoadingMore(true)
        setError("")

        try {
            const result = await getProfileConnections(profileId, openType, nextOffset)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setItems((current) => appendUniqueItems(current, result.items))
            setHasMore(result.hasMore)
            setNextOffset(result.nextOffset)
        } catch (error) {
            console.error("PROFILE CONNECTIONS LOAD MORE ERROR:", error)
            setError("Не удалось загрузить список")
        } finally {
            loadLockRef.current = false
            setIsLoadingMore(false)
        }
    }

    return (
        <>
            <button type="button" onClick={() => void handleOpen("followers")} className="cursor-pointer border-b border-gray-100 px-2 py-4 text-center transition-colors hover:bg-green-50 sm:border-b-0 sm:border-r">
                <div className="text-lg font-bold">{subscriberCount}</div>
                <div className="mt-1 text-xs text-main-gray">подписчиков</div>
            </button>

            <button type="button" onClick={() => void handleOpen("following")} className="cursor-pointer border-r border-gray-100 px-2 py-4 text-center transition-colors hover:bg-green-50">
                <div className="text-lg font-bold">{followingCount}</div>
                <div className="mt-1 text-xs text-main-gray">подписок</div>
            </button>

            {openType && (
                <div onClick={() => setOpenType(null)} className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                    <div onClick={(event) => event.stopPropagation()} className="flex max-h-[80vh] w-full max-w-[520] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div>
                                <div className="text-base font-bold text-gray-900">{openType === "followers" ? "Подписчики" : "Подписки"}</div>
                                <div className="mt-0.5 text-xs text-main-gray">{openType === "followers" ? `${subscriberCount} подписчиков` : `${followingCount} подписок`}</div>
                            </div>

                            <button type="button" onClick={() => setOpenType(null)} aria-label="Закрыть" className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {isLoading && (
                                <div className="flex min-h-[260] items-center justify-center">
                                    <div className="flex items-center gap-2 text-sm text-main-gray">
                                        <LoaderCircle className="size-5 animate-spin" />
                                        <span>Загружаем...</span>
                                    </div>
                                </div>
                            )}

                            {!isLoading && !error && items.length === 0 && <div className="flex min-h-[260] items-center justify-center px-5 text-center text-sm text-main-gray">{openType === "followers" ? "Подписчиков пока нет" : "Подписок пока нет"}</div>}

                            {!isLoading && items.length > 0 && (
                                <div className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                                            <Link href={`/profile/${item.username}`} onClick={() => setOpenType(null)} className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                                    <Image src={item.avatarUrl ?? "/user-avatar.svg"} alt={item.displayName} fill sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-gray-900">{item.displayName}</div>
                                                    <div className="mt-0.5 truncate text-xs text-main-gray">@{item.username}</div>
                                                </div>
                                            </Link>

                                            {item.isCurrentUser ? <div className="shrink-0 rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-main-gray">Это вы</div> : <FollowButton profileId={item.id} username={item.username} initialFollowing={item.isFollowing} variant="compact" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isLoading && error && <div className="border-t border-gray-100 px-5 py-3 text-center text-sm text-red-500">{error}</div>}

                            {!isLoading && hasMore && (
                                <div className="border-t border-gray-100 p-4">
                                    <button type="button" onClick={() => void handleLoadMore()} disabled={isLoadingMore} className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-100 text-sm font-medium text-main-green transition-colors hover:bg-green-50 disabled:cursor-wait disabled:opacity-60">
                                        {isLoadingMore && <LoaderCircle className="size-4 animate-spin" />}
                                        <span>{isLoadingMore ? "Загружаем..." : "Показать ещё"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ProfileConnectionsStats