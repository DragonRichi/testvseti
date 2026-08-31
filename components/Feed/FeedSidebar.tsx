"use client"
import { Bell, Bookmark, Home, Menu, MessageCircle, Search, Settings, UserRound, UsersRound, X } from "lucide-react"
import Link from "next/link"
import Logo from "../ui/Logo"
import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"

type Profile = {
    id: string,
    username: string,
    display_name: string,
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
        name: "Уведомления",
        href: "/notifications",
        icon: Bell
    },
    {
        name: "Сохранённое",
        href: "/saved",
        icon: Bookmark
    },
    {
        name: "Друзья",
        href: "/friends",
        icon: UserRound
    },
    {
        name: "Группы",
        href: "/groups",
        icon: UsersRound
    },
    {
        name: "Поиск",
        href: "/search",
        icon: Search
    },
    {
        name: "Настройки",
        href: "/settings",
        icon: Settings
    }
]

function FeedSidebar({ profile }: Props) {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const pathName = usePathname()
    const profileHref = profile ? `/profile/${profile.username}` : "#"

    const renderMenu = (mobile = false) => (
        <>
            <nav className="mt-5 flex flex-col gap-1">
                {
                    menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathName === item.href || pathName.startsWith(`${item.href}/`)
                        return (
                            <Link
                                href={item.href}
                                key={item.href}
                                onClick={() => mobile && setIsOpen(false)}
                                className={`flex h-12 items-center gap-4 rounded-xl px-4 text-[15] font-medium transition-colors ${isActive ? "bg-green-50 text-main-green" : "text-gray-700 hover:bg-green-50 hover:text-main-green"}`}
                            >
                                <Icon className="size-5 shrink-0" strokeWidth={1.8} />
                                <span>{item.name}</span>
                                {item.name === "Сообщения" && (
                                    <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-main-green text-xs text-white">
                                        3
                                    </span>
                                )}

                                {item.name === "Уведомления" && (
                                    <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-main-green text-xs text-white">
                                        8
                                    </span>
                                )}
                            </Link>
                        )
                    })
                }
            </nav>
            <Link href={profileHref} onClick={() => mobile && setIsOpen(false)} className="mt-auto flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-green-50">
                <Image
                    src={profile?.avatar_url ?? "/user-avatar.svg"}
                    alt={profile?.username ?? "avatar"}
                    width={42}
                    height={42}
                    className="size-11 rounded-full object-cover"
                    loading="eager"
                />
                <div className="min-w-0 flex flex-col">
                    <div className="truncate text-base font-bold">
                        {profile?.display_name ?? "Профиль"}
                    </div>
                    {profile?.username && (
                        <div className="truncate text-sm text-main-gray">
                            @{profile.username}
                        </div>
                    )}
                </div>
            </Link>
        </>
    )

    return (
        <>
            <aside className="sticky top-0 hidden h-screen flex-col px-4 py-5 lg:flex">
                <Logo />
                {renderMenu()}
            </aside>
            <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-black/5 bg-white/95 px-4 backdrop-blur-md lg:hidden">
                <Logo />
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Открыть меню"
                    className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-green-50 hover:text-main-green"
                >
                    <Menu className="size-6" />
                </button>
            </div>
            <div
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] transition-all duration-300 lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                <aside onClick={(e) => e.stopPropagation()} className={`absolute left-0 top-0 flex h-full w-[290] flex-col bg-white px-4 py-5 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <div className="flex items-center justify-between">
                        <Logo />

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Закрыть меню"
                            className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-green-50 hover:text-main-green">
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
