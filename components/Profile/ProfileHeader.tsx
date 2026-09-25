import type { ProfileTab } from "@/types/profileContent"
import { BarChart3, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import FollowButton from "./FollowButton"
import ProfileConnectionsStatsServer from "./ProfileConnectionsStatsServer"
import ProfileInfoBlock from "./ProfileInfoBlock"
import ProfileMoreMenu from "./ProfileMoreMenu"
import ProfileQuickActions from "./ProfileQuickActions"
import ProfileTabs from "./ProfileTabs"
import StartDirectConversationButton from "./StartDirectConversationButton"

type ProfileData = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    cover_url: string | null
    bio: string | null
    birth_date: string | null
    location_label: string | null
    website_url: string | null
    subscriber_count: number | null
    following_count: number | null
    is_verified: boolean | null
    badge_title: string | null
    interests?: string[] | null
}

type Props = {
    profile: ProfileData
    isOwnProfile: boolean
    isFollowing: boolean
    activeTab: ProfileTab
}

function ProfileHeader({
    profile,
    isOwnProfile,
    isFollowing,
    activeTab
}: Props) {
    return (
        <section className="overflow-hidden rounded-[28px] bg-white">
            <div className="relative h-[165] overflow-hidden rounded-t-[28px] bg-[#e9ece9]">
                {profile.cover_url ? (
                    <Image
                        src={
                            profile.cover_url
                        }
                        alt="Обложка профиля"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 800px"
                        unoptimized={
                            process.env
                                .NODE_ENV ===
                            "development"
                        }
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-[#dfeee1] via-[#eef3ee] to-[#dce9e2]" />
                )}
            </div>

            <div className="relative z-10 mt-[-18] rounded-t-[28px] bg-white px-5 pt-5 sm:px-6">
                <ProfileInfoBlock
                    profile={
                        profile
                    }
                />

                <div className="mt-5">
                    <ProfileConnectionsStatsServer
                        profileId={
                            profile.id
                        }
                        subscriberCount={
                            profile.subscriber_count ??
                            0
                        }
                        followingCount={
                            profile.following_count ??
                            0
                        }
                    />
                </div>

                {isOwnProfile ? (
                    <div className="mt-4 flex w-full min-w-0 items-center gap-2">
                        <Link
                            href="/settings/profile"
                            className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl border border-[#dedede] bg-white px-3 text-[13px] font-semibold text-[#616161] transition-colors hover:bg-[#f7f7f7] hover:text-[#202020] sm:h-12 sm:gap-2 sm:px-4 sm:text-[15px]"
                        >
                            <Settings
                                className="hidden size-5 shrink-0 sm:block"
                                strokeWidth={
                                    1.6
                                }
                            />

                            <span className="truncate whitespace-nowrap">
                                Редактировать профиль
                            </span>
                        </Link>

                        <button
                            type="button"
                            aria-label="Статистика профиля"
                            title="Статистика профиля"
                            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#dedede] bg-white text-[#616161] transition-colors hover:bg-[#f7f7f7] hover:text-[#202020] sm:size-12"
                        >
                            <BarChart3
                                className="size-[18] sm:size-5"
                                strokeWidth={
                                    1.6
                                }
                            />
                        </button>

                        <ProfileMoreMenu
                            username={
                                profile.username
                            }
                            isOwnProfile
                        />
                    </div>
                ) : (
                    <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-1">
                            <div className="min-w-0 sm:flex-1">
                                <FollowButton
                                    profileId={
                                        profile.id
                                    }
                                    username={
                                        profile.username
                                    }
                                    initialFollowing={
                                        isFollowing
                                    }
                                />
                            </div>

                            <div className="min-w-0 sm:flex-1">
                                <StartDirectConversationButton
                                    profileId={
                                        profile.id
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 sm:shrink-0 sm:justify-start">
                            <ProfileQuickActions
                                profileId={
                                    profile.id
                                }
                                username={
                                    profile.username
                                }
                            />

                            <ProfileMoreMenu
                                username={
                                    profile.username
                                }
                                isOwnProfile={
                                    false
                                }
                            />
                        </div>
                    </div>
                )}

                <ProfileTabs
                    username={
                        profile.username
                    }
                    activeTab={
                        activeTab
                    }
                />
            </div>
        </section>
    )
}

export default ProfileHeader