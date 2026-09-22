import UserAvatar from "@/components/ui/UserAvatar"
import {
    BadgeCheck,
    CalendarDays,
    Link2,
    MapPin,
    MoreHorizontal
} from "lucide-react"
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
    const formattedBirthDate =
        profile.birth_date
            ? new Intl.DateTimeFormat(
                "ru-RU",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            ).format(
                new Date(
                    profile.birth_date
                )
            )
            : null

    return (
        <section className="overflow-hidden rounded-3xl border border-green-100 bg-white">
            <div className="relative h-[180] overflow-hidden bg-bg-green sm:h-[230]">
                {profile.cover_url ? (
                    <Image
                        src={profile.cover_url}
                        alt="Обложка профиля"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 800px"
                        unoptimized={
                            process.env.NODE_ENV ===
                            "development"
                        }
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-green-100 via-[#eaf7ed] to-green-50" />
                )}
            </div>

            <div className="px-4 pb-5 sm:px-7 sm:pb-7">
                <div className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:items-start">
                    <div className="relative order-1 mt-[-58] shrink-0 sm:mt-[-70]">
                        <UserAvatar
                            userId={profile.id}
                            displayName={
                                profile.display_name
                            }
                            avatarUrl={
                                profile.avatar_url
                            }
                            priority
                            sizeClassName="size-[112] sm:size-[140]"
                            textClassName="text-[46px] sm:text-[58px]"
                            className="border-4 border-white shadow-sm"
                        />

                        <span className="absolute bottom-1 right-1 size-5 rounded-full border-[3px] border-white bg-main-green sm:bottom-3 sm:right-3 sm:size-6" />
                    </div>

                    <div className="order-2 mt-3 w-full min-w-0 text-center sm:order-3 sm:mt-4 sm:basis-full sm:text-left">
                        <div className="flex min-w-0 items-center justify-center gap-1.5 sm:justify-start">
                            <h1 className="min-w-0 wrap-break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                                {
                                    profile.display_name
                                }
                            </h1>

                            {profile.is_verified && (
                                <BadgeCheck className="size-5 shrink-0 fill-main-green text-white sm:size-6" />
                            )}
                        </div>

                        <div className="mt-0.5 text-sm text-main-gray">
                            @
                            {
                                profile.username
                            }
                        </div>

                        {profile.badge_title && (
                            <div className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-main-green">
                                {
                                    profile.badge_title
                                }
                            </div>
                        )}

                        {profile.bio && (
                            <div className="mx-auto mt-4 max-w-[650] text-sm leading-6 text-gray-700 sm:mx-0">
                                {
                                    profile.bio
                                }
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-main-gray sm:justify-start">
                            {profile.location_label && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="size-4 shrink-0" />

                                    <span>
                                        {
                                            profile.location_label
                                        }
                                    </span>
                                </div>
                            )}

                            {formattedBirthDate && (
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays className="size-4 shrink-0" />

                                    <span>
                                        {
                                            formattedBirthDate
                                        }
                                    </span>
                                </div>
                            )}

                            {profile.website_url && (
                                <Link
                                    href={
                                        profile.website_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex min-w-0 items-center gap-1.5 text-main-green transition-colors hover:text-hover-green"
                                >
                                    <Link2 className="size-4 shrink-0" />

                                    <span className="truncate">
                                        {profile.website_url
                                            .replace(
                                                /^https?:\/\//,
                                                ""
                                            )
                                            .replace(
                                                /\/$/,
                                                ""
                                            )}
                                    </span>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className={`order-3 mt-5 w-full max-w-[390] gap-2 sm:order-2 sm:ml-auto sm:mt-4 sm:flex sm:w-auto sm:max-w-none ${isOwnProfile ? "grid grid-cols-[minmax(0,1fr)_40px]" : "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]"}`}>
                        {isOwnProfile ? (
                            <div className="min-w-0 *:w-full sm:*:w-auto">
                                <Link
                                    href="/settings/profile"
                                    className="flex h-10 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-xl bg-main-green px-4 text-sm font-semibold text-white transition-colors hover:bg-hover-green sm:w-auto sm:px-5"
                                >
                                    Редактировать
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="min-w-0 *:w-full sm:*:w-auto">
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

                                <div className="min-w-0 *:w-full sm:*:w-auto">
                                    <StartDirectConversationButton
                                        profileId={
                                            profile.id
                                        }
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            aria-label="Ещё"
                            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-main-gray transition-colors hover:bg-gray-50 hover:text-gray-900"
                        >
                            <MoreHorizontal className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-100 sm:mt-6 sm:grid-cols-4">
                    <div className="border-b border-r border-gray-100 px-2 py-4 text-center sm:border-b-0">
                        <div className="text-lg font-bold">
                            {postsCount}
                        </div>

                        <div className="mt-1 text-xs text-main-gray">
                            публикаций
                        </div>
                    </div>

                    <ProfileConnectionsStats
                        profileId={profile.id}
                        subscriberCount={
                            profile.subscriber_count ??
                            0
                        }
                        followingCount={
                            profile.following_count ??
                            0
                        }
                    />

                    <div className="px-2 py-4 text-center">
                        <div className="text-lg font-bold">
                            0
                        </div>

                        <div className="mt-1 text-xs text-main-gray">
                            сохранено
                        </div>
                    </div>
                </div>

                <ProfileTabs />
            </div>
        </section>
    )
}

export default ProfileHeader