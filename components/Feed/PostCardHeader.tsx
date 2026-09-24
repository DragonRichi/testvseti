import type { Profile } from "@/types/social"
import Link from "next/link"
import UserAvatar from "../ui/UserAvatar"

type Props = {
    profile: Profile
    createdAt: string | null
}

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short"
})

function formatPostAge(value: string) {
    const date = new Date(value)
    const milliseconds = Date.now() - date.getTime()

    if (milliseconds < 0) {
        return DATE_FORMATTER.format(date)
    }

    const minutes = Math.floor(milliseconds / 60_000)

    if (minutes < 1) return "сейчас"
    if (minutes < 60) return `${minutes} мин.`

    const hours = Math.floor(minutes / 60)

    if (hours < 24) return `${hours}ч.`

    const days = Math.floor(hours / 24)

    if (days < 7) return `${days}д.`

    return DATE_FORMATTER.format(date)
}

function PostCardHeader({
    profile,
    createdAt
}: Props) {
    return (
        <Link href={`/profile/${profile.username}`} className="shrink-0 rounded-full">
            <UserAvatar userId={profile.id} displayName={profile.display_name} avatarUrl={profile.avatar_url} size={40} />
        </Link>
    )
}

export function PostAuthorLine({
    profile,
    createdAt
}: Props) {
    return (
        <div className="flex min-w-0 items-center gap-1.5">
            <Link href={`/profile/${profile.username}`} className="truncate text-[15px] font-semibold leading-5 text-[#171717] hover:underline">
                {profile.username}
            </Link>

            {createdAt && (
                <span className="shrink-0 text-[12px] text-[#999999]">
                    {formatPostAge(createdAt)}
                </span>
            )}
        </div>
    )
}

export default PostCardHeader