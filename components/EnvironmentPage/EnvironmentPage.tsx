"use client"

import FollowButton from "@/components/Profile/FollowButton"
import type { ProfileConnectionItem } from "@/types/follows"
import { UsersRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

type Tab = "followers" | "following"

type Props = {
    followers: ProfileConnectionItem[]
    following: ProfileConnectionItem[]
}

function EnvironmentPage({ followers, following }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("followers")

    const items = activeTab === "followers" ? followers : following

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
                <button type="button" onClick={() => setActiveTab("followers")} className={`relative flex cursor-pointer items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === "followers" ? "text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <span>Подписчики</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "followers" ? "bg-green-50 text-main-green" : "bg-gray-100 text-main-gray"}`}>{followers.length}</span>

                    {activeTab === "followers" && (
                        <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-main-green" />
                    )}
                </button>

                <button type="button" onClick={() => setActiveTab("following")} className={`relative flex cursor-pointer items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === "following" ? "text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <span>Подписки</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "following" ? "bg-green-50 text-main-green" : "bg-gray-100 text-main-gray"}`}>{following.length}</span>

                    {activeTab === "following" && (
                        <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-main-green" />
                    )}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="flex min-h-[320] flex-col items-center justify-center px-5 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <UsersRound className="size-6" />
                    </div>

                    <div className="mt-4 text-base font-semibold text-gray-900">
                        {activeTab === "followers" ? "Подписчиков пока нет" : "Подписок пока нет"}
                    </div>

                    <div className="mt-1 max-w-[340] text-sm leading-6 text-main-gray">
                        {activeTab === "followers" ? "Здесь появятся пользователи, которые подпишутся на вас" : "Здесь появятся пользователи, на которых вы подписались"}
                    </div>
                </div>
            ) : (
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

                            <FollowButton profileId={item.id} username={item.username} initialFollowing={item.isFollowing} variant="compact" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default EnvironmentPage