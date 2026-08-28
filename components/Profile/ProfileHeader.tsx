import Image from "next/image"

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

function ProfileHeader({ isOwnProfile, profile }: Props) {

    const formattedBirthDate = profile.birth_date ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(profile.birth_date)) : null


    return (
        <section className="overflow-hidden rounded-3xl border border-green-100 bg-white">
            <div className="relative h-[180] overflow-hidden bg-bg-green sm:h-[230]">
                {profile.cover_url ? (
                    <Image
                        src={profile.cover_url}
                        alt="Обложка профиля"
                        fill
                        priority
                        className="object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-green-100 via-[#eaf7ed] to-green-50" />
                )}
            </div>
        </section>
    )
}

export default ProfileHeader
