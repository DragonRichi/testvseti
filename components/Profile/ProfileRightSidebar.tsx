import { Heart, Info, MapPin } from "lucide-react"

type Profile = {
    bio: string | null
    location_label: string | null
    interests: string[] | null
}

type Props = {
    profile: Profile
}


function ProfileRightSidebar({ profile }: Props) {
    return (
        <div className="sticky top-0 flex flex-col gap-4 p-5">
            <div className="rounded-2xl border border-green-100 bg-white p-5">
                <div className="flex items-center gap-2">
                    <Info className="size-5 text-main-green" />
                    <h2 className="font-bold">О себе</h2>
                </div>
                {profile.bio ? (
                    <p className="mt-3 text-sm leading-6 text-gray-700">
                        {profile.bio}
                    </p>
                ) : (
                    <p className="mt-3 text-sm text-main-gray">
                        Пользователь пока ничего не рассказал о себе
                    </p>
                )}
                {
                    profile.location_label && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-main-gray">
                            <MapPin className="size-4 shrink-0" />
                            <span>{profile.location_label}</span>
                        </div>
                    )
                }
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-5">
                <div className="flex items-center gap-2">
                    <Heart className="size-5 text-main-green" />
                    <h2 className="font-bold">Интересы</h2>
                </div>
                {profile.interests && profile.interests.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {profile.interests.map((interest) => (
                            <span key={interest} className="rounded-full bg-green-50 px-3 py-1.5 text-sm text-main-green">
                                {interest}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-main-gray">
                        Интересы пока не указаны
                    </p>
                )}
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold">Друзья</h2>

                    <button type="button" className="cursor-pointer text-sm text-main-green transition-colors hover:text-hover-green">
                        Показать все
                    </button>
                </div>

                <div className="mt-4 flex h-[90] items-center justify-center rounded-xl bg-[#f7faf7] text-sm text-main-gray">
                    Друзья появятся позже
                </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold">Группы</h2>
                    <button type="button" className="cursor-pointer text-sm text-main-green transition-colors hover:text-hover-green">
                        Показать все
                    </button>
                </div>
                <div className="mt-4 flex h-[90] items-center justify-center rounded-xl bg-[#f7faf7] text-sm text-main-gray">
                    Группы появятся позже
                </div>
            </div>

        </div>
    )
}

export default ProfileRightSidebar
