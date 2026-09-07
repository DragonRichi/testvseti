"use client"

import { Bell, UserRound, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import LogoutButton from "../Auth/LogoutButton"

type Props = {
  profile: {
    username: string
    display_name: string
    avatar_url: string | null
  } | null
}

function FeedHeader({ profile }: Props) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const profileHref = profile ? `/profile/${profile.username}` : "#"

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(event.target as Node)) return

      setIsUserMenuOpen(false)
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 mb-4 hidden h-14 items-center justify-between border-b border-green-100 bg-[#f7faf7]/95 backdrop-blur-md lg:flex">
      <h1 className="text-lg font-bold text-gray-900">Для вас</h1>

      <div className="flex items-center gap-2">
        <Link href="/notifications" aria-label="Уведомления" className="relative flex size-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-green-50 hover:text-main-green">
          <Bell className="size-5" strokeWidth={1.8} />
        </Link>

        <div ref={menuRef} className="relative">
          <button type="button" onClick={() => setIsUserMenuOpen((current) => !current)} aria-label="Меню пользователя" className="relative size-9 cursor-pointer overflow-hidden rounded-full bg-bg-green">
            <Image src={profile?.avatar_url ?? "/user-avatar.svg"} alt={profile?.display_name ?? "Профиль"} fill sizes="36px" loading="eager" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 z-1000 w-[220] overflow-hidden rounded-2xl border border-green-100 bg-white p-2 shadow-lg">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{profile?.display_name ?? "Пользователь"}</div>
                  {profile && <div className="mt-0.5 truncate text-xs text-main-gray">@{profile.username}</div>}
                </div>

                <button type="button" onClick={() => setIsUserMenuOpen(false)} aria-label="Закрыть меню" className="flex size-8 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100">
                  <X className="size-4" />
                </button>
              </div>

              <div className="my-1 border-t border-gray-100" />

              <Link href={profileHref} onClick={() => setIsUserMenuOpen(false)} className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-main-green">
                <UserRound className="size-4" />
                <span>Мой профиль</span>
              </Link>

              <LogoutButton variant="menu" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default FeedHeader