import UserAvatar from "@/components/ui/UserAvatar"
import { BadgeCheck, Briefcase, CalendarDays, Link2, MapPin } from "lucide-react"
import Link from "next/link"
import ProfileInterests from "./ProfileInterests"

type ProfileData = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    bio: string | null
    birth_date: string | null
    location_label: string | null
    website_url: string | null
    is_verified: boolean | null
    badge_title: string | null
    interests?: string[] | null
    app_store_url?: string | null
    google_play_url?: string | null
}

type Props = {
    profile: ProfileData
}

function formatBirthDate(value: string | null) {
    if (!value) return null

    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date(value))
}

function ProfileBio({
    text
}: {
    text: string
}) {
    const parts = text.split(/(@[A-Za-zА-Яа-яЁё0-9._-]+)/g)

    return (
        <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-[#202020] sm:text-[15px]">
            {parts.map((part, index) => {
                if (part.startsWith("@")) {
                    return (
                        <span key={`${part}-${index}`} className="text-main-green">
                            {part}
                        </span>
                    )
                }

                return part
            })}
        </p>
    )
}

function ProfileInfoBlock({
    profile
}: Props) {
    const birthDate = formatBirthDate(profile.birth_date)

    const websiteLabel = profile.website_url
        ?.replace(/^https?:\/\//, "")
        .replace(/\/$/, "")

    const hasLinks = Boolean(
        profile.app_store_url ||
        profile.google_play_url ||
        profile.website_url
    )

    return (
        <div className="relative">
            <div className="absolute right-0 top-0">
                <div className="relative">
                    <UserAvatar
                        userId={profile.id}
                        displayName={profile.display_name}
                        avatarUrl={profile.avatar_url}
                        priority
                        sizeClassName="size-[78] sm:size-[88]"
                        textClassName="text-[28px] sm:text-[32px]"
                        className="border-[3px] border-white ring-2 ring-main-green"
                    />

                    {profile.is_verified && (
                        <span className="absolute bottom-0 left-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-main-green text-white">
                            <BadgeCheck className="size-4" strokeWidth={2} />
                        </span>
                    )}
                </div>
            </div>

            <div className="min-w-0 pr-[100] sm:pr-[118]">
                <div className="flex min-w-0 items-center gap-1.5">
                    <h1 className="truncate text-[23px] font-bold leading-[1.15] tracking-[-0.02em] text-[#171717] sm:text-[25px]">
                        {profile.display_name}
                    </h1>

                    {profile.is_verified && (
                        <BadgeCheck className="size-[17] shrink-0 fill-main-green text-white" />
                    )}
                </div>

                <div className="mt-1 text-[13px] text-[#999999]">
                    @{profile.username}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#666666] sm:text-[13px]">
                {profile.location_label && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-[#888888]" strokeWidth={1.7} />
                        <span>{profile.location_label}</span>
                    </div>
                )}

                {profile.badge_title && (
                    <div className="flex items-center gap-1.5">
                        <Briefcase className="size-3.5 shrink-0 text-[#888888]" strokeWidth={1.7} />
                        <span>{profile.badge_title}</span>
                    </div>
                )}

                {birthDate && (
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 shrink-0 text-[#888888]" strokeWidth={1.7} />
                        <span>{birthDate}</span>
                    </div>
                )}
            </div>

            {profile.bio && (
                <div className="mt-4 max-w-[650]">
                    <ProfileBio text={profile.bio} />
                </div>
            )}

            {hasLinks && (
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {profile.app_store_url && (
                        <Link href={profile.app_store_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] font-medium text-main-green transition-opacity hover:opacity-70">
                            <Link2 className="size-3.5" strokeWidth={1.7} />
                            <span>Скачать в AppStore</span>
                        </Link>
                    )}

                    {profile.google_play_url && (
                        <Link href={profile.google_play_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] font-medium text-main-green transition-opacity hover:opacity-70">
                            <Link2 className="size-3.5" strokeWidth={1.7} />
                            <span>Скачать в Google Play</span>
                        </Link>
                    )}

                    {profile.website_url && (
                        <Link href={profile.website_url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-main-green transition-opacity hover:opacity-70">
                            <Link2 className="size-3.5 shrink-0" strokeWidth={1.7} />
                            <span className="max-w-[180] truncate">
                                {websiteLabel}
                            </span>
                        </Link>
                    )}
                </div>
            )}

            <ProfileInterests
                interests={
                    profile.interests ?? []
                }
            />
        </div>
    )
}

export default ProfileInfoBlock