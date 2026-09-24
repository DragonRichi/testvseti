import UserAvatar from "@/components/ui/UserAvatar"
import { AtSign, BadgeCheck, Bell, CalendarDays, Link2, MapPin, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import FollowButton from "./FollowButton"
import ProfileConnectionsStats from "./ProfileConnectionsStats"
import ProfileTabs from "./ProfileTabs"
import StartDirectConversationButton from "./StartDirectConversationButton"

type Profile = {
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
    profile: Profile
    isOwnProfile: boolean
    isFollowing: boolean
    postsCount: number
}

function ProfileHeader({
    isOwnProfile,
    isFollowing,
    profile,
    postsCount
}: Props) {
    const formattedBirthDate = profile.birth_date
        ? new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date(profile.birth_date))
        : null

    const websiteLabel = profile.website_url
        ?.replace(/^https?:\/\//, "")
        .replace(/\/$/, "")

    const interests = profile.interests?.slice(0, 4) ?? []
    const extraInterests = Math.max(0, (profile.interests?.length ?? 0) - interests.length)

    return (
        <section className="overflow-hidden rounded-[18px] bg-white">
            <div className="relative h-[170] overflow-hidden bg-[#e9ece9] sm:h-[230]">
                {profile.cover_url ? (
                    <Image src={profile.cover_url} alt="Обложка профиля" fill priority sizes="(max-width: 1024px) 100vw, 800px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-[#dfeee1] via-[#eef3ee] to-[#dce9e2]" />
                )}
            </div>

            <div className="relative rounded-t-[18px] bg-white px-4 pb-0 pt-4 sm:px-6 sm:pt-5">
                <div className="absolute right-4 top-[-54] sm:right-6 sm:top-[-64]">
                    <div className="relative">
                        <UserAvatar
                            userId={profile.id}
                            displayName={profile.display_name}
                            avatarUrl={profile.avatar_url}
                            priority
                            sizeClassName="size-[92] sm:size-[112]"
                            textClassName="text-[36px] sm:text-[44px]"
                            className="border-4 border-white ring-2 ring-main-green"
                        />

                        {profile.is_verified && (
                            <span className="absolute bottom-0 left-0 flex size-6 items-center justify-center rounded-full border-[3px] border-white bg-main-green text-white sm:size-7">
                                <BadgeCheck className="size-4 fill-main-green" />
                            </span>
                        )}
                    </div>
                </div>

                <div className="min-w-0 pr-[112] sm:pr-[140]">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <h1 className="truncate text-[22px] font-bold tracking-[-0.02em] text-[#151515] sm:text-[26px]">
                            {profile.display_name}
                        </h1>

                        {profile.is_verified && (
                            <BadgeCheck className="size-[18] shrink-0 fill-main-green text-white" />
                        )}
                    </div>

                    <div className="mt-0.5 text-[13px] text-[#999999]">
                        @{profile.username}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#777777]">
                    {profile.location_label && (
                        <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" strokeWidth={1.6} />
                            {profile.location_label}
                        </span>
                    )}

                    {profile.badge_title && (
                        <span className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-[#999999]" />
                            {profile.badge_title}
                        </span>
                    )}

                    {formattedBirthDate && (
                        <span className="flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" strokeWidth={1.6} />
                            {formattedBirthDate}
                        </span>
                    )}
                </div>

                {profile.bio && (
                    <p className="mt-4 max-w-[650] whitespace-pre-wrap text-[14px] leading-[1.55] text-[#252525]">
                        {profile.bio}
                    </p>
                )}

                {profile.website_url && (
                    <div className="mt-4">
                        <Link href={profile.website_url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-main-green hover:underline">
                            <Link2 className="size-4 shrink-0" strokeWidth={1.6} />
                            <span className="max-w-[280] truncate">
                                {websiteLabel}
                            </span>
                        </Link>
                    </div>
                )}

                {(interests.length > 0 || extraInterests > 0) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {interests.map((interest) => (
                            <span key={interest} className="rounded-[10px] border border-[#e6e6e6] bg-white px-3 py-1.5 text-[12px] text-[#666666]">
                                {interest}
                            </span>
                        ))}

                        {extraInterests > 0 && (
                            <span className="rounded-[10px] border border-[#e6e6e6] bg-white px-3 py-1.5 text-[12px] text-[#777777]">
                                +{extraInterests}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[14px] font-bold text-[#171717]">
                            {postsCount}
                        </span>

                        <span className="text-[12px] text-[#888888]">
                            публикаций
                        </span>
                    </div>

                    <ProfileConnectionsStats
                        profileId={profile.id}
                        subscriberCount={profile.subscriber_count ?? 0}
                        followingCount={profile.following_count ?? 0}
                    />
                </div>

                <div className="mt-5 flex w-full items-center gap-2">
                    {isOwnProfile ? (
                        <Link href="/settings/profile" className="flex h-[42] min-w-0 flex-1 items-center justify-center rounded-[10px] bg-main-green px-5 text-[14px] font-semibold text-white transition-colors hover:bg-hover-green">
                            Редактировать профиль
                        </Link>
                    ) : (
                        <>
                            <div className="min-w-0 flex-1">
                                <FollowButton profileId={profile.id} username={profile.username} initialFollowing={isFollowing} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <StartDirectConversationButton profileId={profile.id} />
                            </div>
                        </>
                    )}

                    {!isOwnProfile && (
                        <>
                            <button type="button" aria-label="Упоминание" className="flex size-[42] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e3e3e3] text-[#616161] transition-colors hover:bg-[#f5f5f5]">
                                <AtSign className="size-[18]" strokeWidth={1.6} />
                            </button>

                            <button type="button" aria-label="Уведомления" className="flex size-[42] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e3e3e3] text-[#616161] transition-colors hover:bg-[#f5f5f5]">
                                <Bell className="size-[18]" strokeWidth={1.6} />
                            </button>
                        </>
                    )}

                    <button type="button" aria-label="Ещё" className="flex size-[42] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e3e3e3] text-[#616161] transition-colors hover:bg-[#f5f5f5]">
                        <MoreHorizontal className="size-5" strokeWidth={1.6} />
                    </button>
                </div>

                <ProfileTabs />
            </div>
        </section>
    )
}

export default ProfileHeader