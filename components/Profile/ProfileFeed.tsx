import { ImagePlus, PenLine } from "lucide-react"
import Image from "next/image"

type Profile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

type Props = {
    profile: Profile
    isOwnProfile: boolean
}

const PROFILE_BUTTON = [
    { title: "Фото" },
    { title: "Видео" },
    { title: "Опрос" },
    { title: "Настроение" },
]

function ProfileFeed({ profile, isOwnProfile }: Props) {
    return (
        <div className="mt-4 flex flex-col gap-4">
            {isOwnProfile && (
                <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                            <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                        </div>
                        <button
                            type="button"
                            className="flex h-11 flex-1 cursor-pointer items-center rounded-xl border border-gray-100 bg-[#f8faf8] px-4 text-left text-sm text-main-gray transition-colors hover:border-green-100 hover:bg-green-50/50">
                            Что у вас нового?
                        </button>
                    </div>
                    <div className="mt-4 flex items-center gap-1 border-t border-gray-100 pt-3 sm:gap-2">
                        {PROFILE_BUTTON.map((item) => (
                            <button
                                key={item.title}
                                type="button"
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-main-gray transition-colors hover:bg-green-50 hover:text-main-green"
                            >
                                <ImagePlus className="size-5" />
                                <span className="hidden sm:inline">{item.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex min-h-[300] flex-col items-center justify-center rounded-2xl border border-green-100 bg-white px-6 py-10 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-50">
                    <PenLine className="size-6 text-main-green" />
                </div>
                <h2 className="mt-4 text-lg font-bold">
                    Публикаций пока нет
                </h2>
                <p>
                    {isOwnProfile ? "Создайте первую публикацию и поделитесь чем-нибудь интересным." : `${profile.display_name} пока ничего не опубликовал.`}
                </p>
                {isOwnProfile && (
                    <button
                        type="button"
                        className="mt-5 flex h-10 cursor-pointer items-center justify-center rounded-xl bg-main-green px-5 text-sm font-medium text-white transition-colors hover:bg-hover-green"
                    >
                        Создать публикацию
                    </button>
                )}
            </div>
        </div>
    )
}

export default ProfileFeed
