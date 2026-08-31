import { BadgeCheck, CalendarDays, Link2, MapPin, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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
    is_verified: boolean | null
    badge_title: string | null
}

type Props = {
    profile: Profile
    isOwnProfile: boolean
}

const PROFILE_LINKS = [
    {
        title: "Публикации"
    },
    {
        title: "Сохранённое"
    },
    {
        title: "Друзья"
    },
    {
        title: "Группы"
    },
    {
        title: "Информация"
    }
]

function ProfileHeader({ isOwnProfile, profile }: Props) {
    const formattedBirthDate = profile.birth_date ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(profile.birth_date)) : null

    return (
        <section className="overflow-hidden rounded-3xl border border-green-100 bg-white">
            <div className="relative h-[180] overflow-hidden bg-bg-green sm:h-[230]">
                {profile.cover_url ? (
                    <Image src={profile.cover_url} alt="Обложка профиля" fill priority className="object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-green-100 via-[#eaf7ed] to-green-50" />
                )}
            </div>

            <div className="px-5 pb-5 sm:px-7 sm:pb-7">
                <div className="flex items-start justify-between">
                    <div className="relative mt-[58] shrink-0 sm:mt-[70]">
                        <div className="relative size-[116] overflow-hidden rounded-full border-4 border-white bg-bg-green sm:size-[140]">
                            <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill priority className="object-cover" />
                        </div>

                        <span className="absolute bottom-2 right-2 size-5 rounded-full border-4 border-white bg-main-green sm:bottom-3 sm:right-3" />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        {isOwnProfile ? (
                            <Link href="/settings/profile" className="flex h-10 items-center justify-center rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                                Редактировать профиль
                            </Link>
                        ) : (
                            <button type="button" className="flex h-10 cursor-pointer items-center justify-center rounded-xl bg-main-green px-5 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                                Подписаться
                            </button>
                        )}

                        <button type="button" className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-main-gray transition-colors hover:bg-gray-50 hover:text-black">
                            <MoreHorizontal className="size-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {profile.display_name}
                        </h1>

                        {profile.is_verified && (
                            <BadgeCheck className="size-6 fill-main-green text-white" />
                        )}
                    </div>

                    <div className="mt-1 text-sm text-main-gray">
                        @{profile.username}
                    </div>

                    {profile.badge_title && (
                        <div className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-main-green">
                            {profile.badge_title}
                        </div>
                    )}

                    {profile.bio && (
                        <div className="mt-4 max-w-[650] text-[15px] leading-6 text-gray-700">
                            {profile.bio}
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-main-gray">
                        {profile.location_label && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="size-4" />
                                <span>{profile.location_label}</span>
                            </div>
                        )}

                        {formattedBirthDate && (
                            <div className="flex items-center gap-1.5">
                                <CalendarDays className="size-4" />
                                <span>{formattedBirthDate}</span>
                            </div>
                        )}

                        {profile.website_url && (
                            <Link href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-main-green transition-colors hover:text-hover-green">
                                <Link2 className="size-4" />
                                <span>{profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 sm:grid-cols-4 sm:divide-y-0">
                    <div className="px-2 py-4 text-center">
                        <div className="text-lg font-bold">0</div>
                        <div className="mt-1 text-xs text-main-gray">публикаций</div>
                    </div>

                    <div className="px-2 py-4 text-center">
                        <div className="text-lg font-bold">{profile.subscriber_count ?? 0}</div>
                        <div className="mt-1 text-xs text-main-gray">подписчиков</div>
                    </div>

                    <div className="px-2 py-4 text-center">
                        <div className="text-lg font-bold">0</div>
                        <div className="mt-1 text-xs text-main-gray">подписок</div>
                    </div>

                    <div className="px-2 py-4 text-center">
                        <div className="text-lg font-bold">0</div>
                        <div className="mt-1 text-xs text-main-gray">сохранено</div>
                    </div>
                </div>

                <div className="mt-5 flex overflow-x-auto border-b border-gray-100">
                    {PROFILE_LINKS.map((item, index) => (
                        <button key={item.title} type="button" className={`shrink-0 cursor-pointer border-b-2 px-4 pb-3 text-sm transition-colors ${index === 0 ? "border-main-green font-medium text-main-green" : "border-transparent text-main-gray hover:text-black"}`}>
                            {item.title}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ProfileHeader