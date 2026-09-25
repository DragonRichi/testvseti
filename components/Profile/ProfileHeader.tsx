import Image from "next/image"
import Link from "next/link"
import FollowButton from "./FollowButton"
import ProfileConnectionsStatsServer from "./ProfileConnectionsStatsServer"
import ProfileInfoBlock from "./ProfileInfoBlock"
import ProfileTabs from "./ProfileTabs"
import StartDirectConversationButton from "./StartDirectConversationButton"
import ProfileMoreMenu from "./ProfileMoreMenu"
import ProfileQuickActions from "./ProfileQuickActions"
import { BarChart3, Settings } from "lucide-react"

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
    app_store_url?: string | null
    google_play_url?: string | null
}

type Props = {
    profile: ProfileData
    isOwnProfile: boolean
    isFollowing: boolean
    postsCount: number
}

function ProfileHeader({
    profile,
    isOwnProfile,
    isFollowing,
    postsCount
}: Props) {
    return (
        <section className="overflow-hidden rounded-[28px] bg-white">
            <div className="relative h-[165] overflow-hidden rounded-t-[28px] bg-[#e9ece9]">
                {profile.cover_url ? (
                    <Image src={profile.cover_url} alt="Обложка профиля" fill priority sizes="(max-width: 1024px) 100vw, 800px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-[#dfeee1] via-[#eef3ee] to-[#dce9e2]" />
                )}
            </div>

            <div className="relative z-10 mt-[-18] rounded-t-[28px] bg-white px-5 pb-0 pt-5 sm:px-6">
                <ProfileInfoBlock profile={profile} />

                <div className="mt-5">
                    <ProfileConnectionsStatsServer
                        profileId={profile.id}
                        subscriberCount={profile.subscriber_count ?? 0}
                        followingCount={profile.following_count ?? 0}
                    />
                </div>

                <div className="mt-4 flex w-full items-center gap-2">
                    {isOwnProfile ? (
                        <>
                            <Link
                                href="/settings/profile"
                                className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dedede] bg-white px-4 text-[15px] font-semibold text-[#616161] transition-colors hover:bg-[#f7f7f7] hover:text-[#202020]"
                            >
                                <Settings className="size-5 shrink-0" strokeWidth={1.6} />
                                <span>Редактировать профиль</span>
                            </Link>

                            <button
                                type="button"
                                aria-label="Статистика профиля"
                                title="Статистика профиля"
                                className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#dedede] bg-white text-[#616161] transition-colors hover:bg-[#f7f7f7] hover:text-[#202020]"
                            >
                                <BarChart3 className="size-5" strokeWidth={1.6} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="min-w-0 flex-1">
                                <FollowButton
                                    profileId={profile.id}
                                    username={profile.username}
                                    initialFollowing={isFollowing}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <StartDirectConversationButton
                                    profileId={profile.id}
                                />
                            </div>

                            <ProfileQuickActions
                                username={profile.username}
                            />
                        </>
                    )}
                    <ProfileMoreMenu
                        username={profile.username}
                        isOwnProfile={isOwnProfile}
                    />
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[12px] text-[#999999]">
                    <span className="font-semibold text-[#171717]">
                        {postsCount}
                    </span>

                    <span>
                        публикаций
                    </span>
                </div>

                <ProfileTabs />
            </div>
        </section>
    )
}

export default ProfileHeader