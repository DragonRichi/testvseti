"use client"

import { getProfileConnections } from "@/actions/getProfileConnections"
import FollowButton from "@/components/Profile/FollowButton"
import type { ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"
import { LoaderCircle, UsersRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef, useState } from "react"

type Props = {
    profileId: string
    initialFollowers: ProfileConnectionItem[]
    initialFollowing: ProfileConnectionItem[]
    followerCount: number
    followingCount: number
    initialFollowersHasMore: boolean
    initialFollowingHasMore: boolean
    initialFollowersOffset: number
    initialFollowingOffset: number
}

function appendUniqueItems(current: ProfileConnectionItem[], next: ProfileConnectionItem[]) {
    const existingIds = new Set(current.map((item) => item.id))

    return [...current, ...next.filter((item) => !existingIds.has(item.id))]
}

function EnvironmentPage({ profileId, initialFollowers, initialFollowing, followerCount, followingCount, initialFollowersHasMore, initialFollowingHasMore, initialFollowersOffset, initialFollowingOffset }: Props) {
    const [activeTab, setActiveTab] = useState<ProfileConnectionType>("followers")
    const [followers, setFollowers] = useState(initialFollowers)
    const [following, setFollowing] = useState(initialFollowing)
    const [followersHasMore, setFollowersHasMore] = useState(initialFollowersHasMore)
    const [followingHasMore, setFollowingHasMore] = useState(initialFollowingHasMore)
    const [followersOffset, setFollowersOffset] = useState(initialFollowersOffset)
    const [followingOffset, setFollowingOffset] = useState(initialFollowingOffset)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState("")
    const loadLockRef = useRef(false)

    const items = activeTab === "followers" ? followers : following
    const hasMore = activeTab === "followers" ? followersHasMore : followingHasMore
    const offset = activeTab === "followers" ? followersOffset : followingOffset

    const handleTabChange = (type: ProfileConnectionType) => {
        setActiveTab(type)
        setError("")
    }

    const handleLoadMore = async () => {
        if (loadLockRef.current || !hasMore) return

        loadLockRef.current = true
        setIsLoadingMore(true)
        setError("")

        try {
            const result = await getProfileConnections(profileId, activeTab, offset)

            if (result.success === false) {
                setError(result.error)
                return
            }

            if (activeTab === "followers") {
                setFollowers((current) => appendUniqueItems(current, result.items))
                setFollowersHasMore(result.hasMore)
                setFollowersOffset(result.nextOffset)
            } else {
                setFollowing((current) => appendUniqueItems(current, result.items))
                setFollowingHasMore(result.hasMore)
                setFollowingOffset(result.nextOffset)
            }
        } catch (error) {
            console.error("ENVIRONMENT LOAD MORE ERROR:", error)
            setError("Не удалось загрузить пользователей")
        } finally {
            loadLockRef.current = false
            setIsLoadingMore(false)
        }
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-green-100 bg-white">
            <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-main-green">
                        <UsersRound className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Окружение</h1>
                        <div className="mt-0.5 text-sm text-main-gray">Люди, с которыми вы связаны</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-100">
                <button type="button" onClick={() => handleTabChange("followers")} className={`relative flex cursor-pointer items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === "followers" ? "text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <span>Подписчики</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "followers" ? "bg-green-50 text-main-green" : "bg-gray-100 text-main-gray"}`}>{followerCount}</span>
                    {activeTab === "followers" && <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-main-green" />}
                </button>

                <button type="button" onClick={() => handleTabChange("following")} className={`relative flex cursor-pointer items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === "following" ? "text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <span>Подписки</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "following" ? "bg-green-50 text-main-green" : "bg-gray-100 text-main-gray"}`}>{followingCount}</span>
                    {activeTab === "following" && <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-main-green" />}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="flex min-h-[320] flex-col items-center justify-center px-5 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <UsersRound className="size-6" />
                    </div>

                    <div className="mt-4 text-base font-semibold text-gray-900">{activeTab === "followers" ? "Подписчиков пока нет" : "Подписок пока нет"}</div>

                    <div className="mt-1 max-w-[340] text-sm leading-6 text-main-gray">{activeTab === "followers" ? "Здесь появятся пользователи, которые подпишутся на вас" : "Здесь появятся пользователи, на которых вы подписались"}</div>
                </div>
            ) : (
                <div>
                    <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                <Link href={`/profile/${item.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                        <Image src={item.avatarUrl ?? "/user-avatar.svg"} alt={item.displayName} fill sizes="48px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
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

                    {error && <div className="border-t border-gray-100 px-5 py-3 text-center text-sm text-red-500">{error}</div>}

                    {hasMore && (
                        <div className="border-t border-gray-100 p-4">
                            <button type="button" onClick={() => void handleLoadMore()} disabled={isLoadingMore} className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-100 text-sm font-medium text-main-green transition-colors hover:bg-green-50 disabled:cursor-wait disabled:opacity-60">
                                {isLoadingMore && <LoaderCircle className="size-4 animate-spin" />}
                                <span>{isLoadingMore ? "Загружаем..." : "Показать ещё"}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default EnvironmentPage