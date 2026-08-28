import { Bell, Bookmark, Home, MessageCircle, Search, Settings, UserRound, UsersRound } from "lucide-react"
import Link from "next/link"
import Logo from "../ui/Logo"

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

function FeedSidebar() {
    return (
        <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
            <Logo />

            <nav className="flex flex-col gap-1 mt-5">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === "/feed"
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex h-12 items-center gap-4 rounded-xl px-4 text-[15] font-medium transition-colors 
                                ${isActive ? "bg-green-50 text-main-green" : "text-gray-700 hover:bg-green-50 hover:text-main-green"}`}
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
                })}
            </nav>
        </div>
    )
}

export default FeedSidebar
