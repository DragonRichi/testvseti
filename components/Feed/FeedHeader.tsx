import { Profile } from "@/types/social"
import { Bell } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import DevDeleteUser from "../Dev/DevDeleteUser"
import LogoutButton from "../Auth/LogoutButton"


type Props = {
  profile: {
    username: string
    display_name: string
    avatar_url: string | null
  } | null
}

function FeedHeader({ profile }: Props) {
  const profileHref = profile ? `/profile/${profile.username}` : "#"
  return (
    <header className="sticky top-0 z-30 mb-4 hidden h-14 items-center justify-between border-b border-green-100 bg-[#f7faf7]/95 backdrop-blur-md lg:flex">
      <h1 className="text-lg font-bold text-gray-900">Для вас</h1>
      <div className="flex items-center gap-2">
        {process.env.NODE_ENV === "development" && (
          <DevDeleteUser />
        )}
        <Link
          href="/notifications"
          aria-label="Уведомления"
          className="relative flex size-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-green-50 hover:text-main-green"
        >
          <Bell className="size-5" strokeWidth={1.8} />
        </Link>
        <Link
          href={profileHref}
          className="relative size-9 overflow-hidden rounded-full bg-bg-green"
        >
          <Image
            src={profile?.avatar_url ?? "/user-avatar.svg"}
            alt={profile?.display_name ?? "Профиль"}
            fill
            sizes="36px"
            loading="eager"
            unoptimized={process.env.NODE_ENV === "development"}
            className="object-cover"
          />
        </Link>
        <LogoutButton />
      </div>
    </header>
  )
}

export default FeedHeader
