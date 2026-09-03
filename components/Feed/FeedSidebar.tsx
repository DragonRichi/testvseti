"use client"

import LogoutButton from "../Auth/LogoutButton"
import Logo from "../ui/Logo"
import { Bell, Home, MapPinned, Menu, MessageCircle, Search, UserRound, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type Profile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
} | null

type Props = {
    profile: Profile
}

const menuItems = [
    {
        name: "Лента",
        href: "/feed",
        icon: Home
    },
    {
        name: "Сообщения",
        href: "/messages",
        icon: MessageCircle
    },
    {
        name: "Геочаты",
        href: "/geochats",
        icon: MapPinned
    },
    {
        name: "Окружение",
        href: "/contacts",
        icon: UserRound
    },
    {
        name: "Поиск",
        href: "/search",
        icon: Search
    }
]

function FeedSidebar({ profile }: Props) {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const pathName = usePathname()
    const profileHref = profile ? `/profile/${profile.username}` : "#"

    useEffect(() => {
        if (!isOpen) return

        const scrollY = window.scrollY

        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = "0"
        document.body.style.right = "0"
        document.body.style.width = "100%"
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.position = ""
            document.body.style.top = ""
            document.body.style.left = ""
            document.body.style.right = ""
            document.body.style.width = ""
            document.body.style.overflow = ""
            document.documentElement.style.overflow = ""

            window.scrollTo(0, scrollY)
        }
    }, [isOpen])

    const renderMenu = (mobile = false) => (
        <>
            <nav className="mt-7 flex flex-col gap-1">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathName === item.href || pathName.startsWith(`${item.href}/`)

                    return (
                        <Link href={item.href} key={item.href} onClick={() => mobile && setIsOpen(false)} className={`flex h-12 items-center gap-4 rounded-xl px-4 text-[15] font-medium transition-colors ${isActive ? "bg-green-50 text-main-green" : "text-gray-700 hover:bg-green-50 hover:text-main-green"}`}>
                            <Icon className="size-5 shrink-0" strokeWidth={1.8} />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {mobile && (
                <div className="mt-auto pt-6">
                    <div className="border-t border-gray-100 pt-4">
                        <Link href={profileHref} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-green-50">
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                <Image src={profile?.avatar_url ?? "/user-avatar.svg"} alt={profile?.display_name ?? "Профиль"} fill sizes="44px" loading="eager" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-bold text-gray-900">{profile?.display_name ?? "Профиль"}</div>

                                {profile?.username && (
                                    <div className="mt-0.5 truncate text-xs text-main-gray">@{profile.username}</div>
                                )}
                            </div>
                        </Link>

                        <div className="mt-2">
                            <LogoutButton variant="menu" />
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    return (
        <>
            <aside className="sticky top-0 hidden h-screen flex-col border-r border-green-100 bg-white px-4 py-5 lg:flex ">
                <Logo />
                {renderMenu()}
            </aside>

            <div className="fixed left-0 right-0 top-0 z-40  flex h-16 items-center border-b border-black/5 bg-white/95 px-4 backdrop-blur-md lg:hidden">
                <Logo />

                <div className="ml-auto flex items-center gap-1">
                    <Link href="/notifications" aria-label="Уведомления" className="flex size-10 items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-green-50 hover:text-main-green">
                        <Bell className="size-5" strokeWidth={1.8} />
                    </Link>

                    <button type="button" onClick={() => setIsOpen(true)} aria-label="Открыть меню" className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-green-50 hover:text-main-green">
                        <Menu className="size-6" />
                    </button>
                </div>
            </div>

            <div onClick={() => setIsOpen(false)} className={`fixed inset-0 z-9999 overscroll-none bg-black/25 backdrop-blur-[2px] transition-all duration-300 lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                <aside onClick={(event) => event.stopPropagation()} className={`absolute left-0 top-0 flex h-full w-[290] flex-col overflow-y-auto overscroll-contain bg-white px-4 py-5 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <div className="flex items-center justify-between">
                        <Logo />

                        <button type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть меню" className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-green-50 hover:text-main-green">
                            <X className="size-5" />
                        </button>
                    </div>

                    {renderMenu(true)}
                </aside>
            </div>
        </>
    )
}

export default FeedSidebar