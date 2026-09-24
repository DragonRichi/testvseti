"use client"

import useUnreadDirectMessagesCount from "@/components/Messages/useUnreadDirectMessagesCount"
import Logo from "@/components/ui/Logo"
import { MapPinned, Menu, Search, UsersRound, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import LogoutButton from "../Auth/LogoutButton"
import Home from "../ui/icons/Home"
import Notifications from "../ui/icons/Notifications"
import Messages from "../ui/icons/Messages"
import Create from "../ui/icons/Create"
import ProfileIcon from "../ui/icons/Profile"
import SidebarMoreMenu from "./SidebarMoreMenu"

type Profile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
} | null

type Props = {
    profile: Profile
}

type MenuLinkItem = {
    name: string
    href: string
    icon: React.ComponentType<{
        className?: string
    }>
    messageBadge?: boolean
}

function FeedSidebar({
    profile
}: Props) {
    const [isOpen, setIsOpen] = useState(false)

    const pathName = usePathname()
    const router = useRouter()

    const profileHref = profile
        ? `/profile/${profile.username}`
        : "#"

    const unreadMessagesCount =
        useUnreadDirectMessagesCount(
            profile?.id ?? null
        )

    const menuItems: MenuLinkItem[] = [
        {
            name: "Главная",
            href: "/feed",
            icon: Home
        },
        {
            name: "Уведомления",
            href: "/notifications",
            icon: Notifications
        },
        {
            name: "Поиск",
            href: "/search",
            icon: Search
        },
        {
            name: "Сообщения",
            href: "/messages",
            icon: Messages,
            messageBadge: true
        },
        {
            name: "Геочаты",
            href: "/geochats",
            icon: MapPinned
        },
        {
            name: "Окружение",
            href: "/contacts",
            icon: UsersRound
        }
    ]

    useEffect(() => {
        router.prefetch("/messages")
        router.prefetch("/feed")

        if (profileHref !== "#") {
            router.prefetch(profileHref)
        }

        const timer =
            window.setTimeout(() => {
                router.prefetch(
                    "/notifications"
                )
                router.prefetch(
                    "/search"
                )
                router.prefetch(
                    "/geochats"
                )
                router.prefetch(
                    "/contacts"
                )
            }, 250)

        return () =>
            window.clearTimeout(timer)
    }, [
        profileHref,
        router
    ])

    useEffect(() => {
        if (!isOpen) return

        const scrollY =
            window.scrollY

        document.body.style.position =
            "fixed"

        document.body.style.top =
            `-${scrollY}px`

        document.body.style.left =
            "0"

        document.body.style.right =
            "0"

        document.body.style.width =
            "100%"

        document.body.style.overflow =
            "hidden"

        document.documentElement.style.overflow =
            "hidden"

        return () => {
            document.body.style.position =
                ""

            document.body.style.top =
                ""

            document.body.style.left =
                ""

            document.body.style.right =
                ""

            document.body.style.width =
                ""

            document.body.style.overflow =
                ""

            document.documentElement.style.overflow =
                ""

            window.scrollTo(
                0,
                scrollY
            )
        }
    }, [isOpen])

    const prefetchMenu = () => {
        for (
            const item
            of menuItems
        ) {
            router.prefetch(
                item.href
            )
        }

        if (profileHref !== "#") {
            router.prefetch(
                profileHref
            )
        }
    }

    const renderLink = (
        item: MenuLinkItem,
        mobile: boolean
    ) => {
        const Icon =
            item.icon

        const isActive =
            pathName === item.href ||
            pathName.startsWith(
                `${item.href}/`
            )

        return (
            <Link
                key={item.href}
                href={item.href}
                prefetch
                onPointerEnter={() =>
                    router.prefetch(
                        item.href
                    )
                }
                onTouchStart={() =>
                    router.prefetch(
                        item.href
                    )
                }
                onClick={() => {
                    if (mobile) {
                        setIsOpen(false)
                    }
                }}
                className={`flex h-11 w-fit max-w-full items-center gap-3 rounded-[14px] px-3 text-[16px] font-medium transition-colors ${isActive
                    ? "text-main-green"
                    : "text-[#616161] hover:bg-[#ededed] hover:text-[#363636]"
                    }`}
            >
                <span className="relative flex size-6 shrink-0 items-center justify-center">
                    <Icon className="size-6" />

                    {item.messageBadge &&
                        unreadMessagesCount >
                        0 && (
                            <span className="absolute -right-2 -top-2 flex h-[16] min-w-[16] items-center justify-center rounded-full bg-[#28b555] px-1 text-[9px] font-semibold leading-none text-white">
                                {unreadMessagesCount >
                                    9
                                    ? "9+"
                                    : unreadMessagesCount}
                            </span>
                        )}
                </span>

                <span className="whitespace-nowrap">
                    {item.name}
                </span>
            </Link>
        )
    }

    const renderNavigation = (
        mobile = false
    ) => (
        <nav
            className={
                mobile
                    ? "mt-8 flex w-full flex-col items-start gap-1"
                    : "absolute left-2 top-1/2 flex w-[196] -translate-y-1/2 flex-col items-start gap-1"
            }
        >
            {menuItems
                .filter((item) => mobile || item.href !== "/geochats")
                .map((item) => renderLink(item, mobile))}

            <button
                type="button"
                className="flex h-11 w-fit max-w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 text-[16px] font-medium text-[#616161] transition-colors hover:bg-[#ededed] hover:text-[#363636]"
            >
                <span className="flex size-6 shrink-0 items-center justify-center">
                    <Create className="size-6" />
                </span>

                <span className="whitespace-nowrap">
                    Создать
                </span>
            </button>

            {profileHref !== "#" && (
                <Link
                    href={profileHref}
                    prefetch
                    onPointerEnter={() =>
                        router.prefetch(
                            profileHref
                        )
                    }
                    onTouchStart={() =>
                        router.prefetch(
                            profileHref
                        )
                    }
                    onClick={() => {
                        if (mobile) {
                            setIsOpen(false)
                        }
                    }}
                    className={`flex h-11 w-fit max-w-full items-center gap-3 rounded-[14px] px-3 text-[16px] font-medium transition-colors ${pathName ===
                        profileHref ||
                        pathName.startsWith(
                            `${profileHref}/`
                        )
                        ? "text-main-green"
                        : "text-[#616161] hover:bg-[#ededed] hover:text-[#363636]"
                        }`}
                >
                    <span className="flex size-6 shrink-0 items-center justify-center">
                        <ProfileIcon className="size-6" />
                    </span>

                    <span className="whitespace-nowrap">
                        Профиль
                    </span>
                </Link>
            )}

            <SidebarMoreMenu mobile={mobile} />
        </nav>
    )

    return (
        <>
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220] flex-col overflow-visible bg-background px-4 py-4 lg:flex">
                <div className="shrink-0 px-1">
                    <Logo />
                </div>

                {renderNavigation()}
            </aside>

            <div className="fixed inset-x-0 top-0 z-40 flex h-[60] items-center border-b border-[#e8e8e8] bg-[#f7f7f7]/95 px-4 backdrop-blur-xl lg:hidden">
                <Logo />

                <button
                    type="button"
                    onPointerEnter={
                        prefetchMenu
                    }
                    onClick={() => {
                        prefetchMenu()
                        setIsOpen(true)
                    }}
                    aria-label="Открыть меню"
                    className="ml-auto flex size-10 cursor-pointer items-center justify-center rounded-full text-[#616161] transition-colors hover:bg-[#ededed]"
                >
                    <Menu className="size-5" />
                </button>
            </div>

            <div
                onClick={() =>
                    setIsOpen(false)
                }
                className={`fixed inset-0 z-9999 overscroll-none bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${isOpen
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                    }`}
            >
                <aside
                    onClick={(
                        event
                    ) =>
                        event.stopPropagation()
                    }
                    className={`absolute left-0 top-0 flex h-full w-[286] flex-col overflow-y-auto overscroll-contain bg-background px-4 py-4 shadow-2xl transition-transform duration-250 ease-out ${isOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <Logo />

                        <button
                            type="button"
                            onClick={() =>
                                setIsOpen(
                                    false
                                )
                            }
                            aria-label="Закрыть меню"
                            className="flex size-10 cursor-pointer items-center justify-center rounded-full text-[#616161] transition-colors hover:bg-[#ededed]"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {renderNavigation(true)}

                    <div className="mt-auto pt-6">
                        <LogoutButton variant="menu" />
                    </div>
                </aside>
            </div>
        </>
    )
}

export default FeedSidebar