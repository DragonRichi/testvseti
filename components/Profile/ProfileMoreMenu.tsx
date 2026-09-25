"use client"

import {
    Ban,
    Check,
    ChevronRight,
    CircleAlert,
    EyeOff,
    Link2,
    MessageCircleWarning,
    MoreHorizontal,
    UserRoundMinus,
    X
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
    username: string
    isOwnProfile: boolean
}

type MenuPosition = {
    top: number
    left: number
}

function ProfileMoreMenu({
    username,
    isOwnProfile
}: Props) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [copied, setCopied] = useState(false)
    const [position, setPosition] = useState<MenuPosition>({
        top: 0,
        left: 0
    })

    useEffect(() => {
        setIsMounted(true)

        const media = window.matchMedia("(max-width: 639px)")

        const updateMobile = () => {
            setIsMobile(media.matches)
        }

        updateMobile()
        media.addEventListener("change", updateMobile)

        return () => {
            media.removeEventListener("change", updateMobile)
        }
    }, [])

    const updatePosition = useCallback(() => {
        const button = buttonRef.current

        if (!button || isMobile) {
            return
        }

        const rect = button.getBoundingClientRect()
        const menuWidth = 268
        const viewportPadding = 12

        const left = Math.min(
            window.innerWidth - menuWidth - viewportPadding,
            Math.max(
                viewportPadding,
                rect.right - menuWidth
            )
        )

        setPosition({
            top: rect.bottom + 8,
            left
        })
    }, [isMobile])

    useEffect(() => {
        if (!isOpen) return

        updatePosition()

        const handleResize = () => {
            updatePosition()
        }

        const handleScroll = () => {
            updatePosition()
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        window.addEventListener("resize", handleResize)
        window.addEventListener("scroll", handleScroll, true)
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("scroll", handleScroll, true)
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, updatePosition])

    useEffect(() => {
        if (!isOpen || isMobile) return

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node

            if (buttonRef.current?.contains(target)) return
            if (menuRef.current?.contains(target)) return

            setIsOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
        }
    }, [isOpen, isMobile])

    useEffect(() => {
        if (!isOpen || !isMobile) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isOpen, isMobile])

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/profile/${username}`

        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)

            window.setTimeout(() => {
                setCopied(false)
            }, 1600)
        } catch (error) {
            console.error("COPY PROFILE LINK ERROR:", error)
        }
    }

    const closeMenu = () => {
        setIsOpen(false)
    }

    const menu = (
        <div
            ref={menuRef}
            style={
                isMobile
                    ? undefined
                    : {
                        top: position.top,
                        left: position.left
                    }
            }
            className={isMobile
                ? "fixed inset-x-3 bottom-3 z-210 overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.20)]"
                : "fixed z-210 w-[268] overflow-hidden rounded-2xl border border-[#e6e6e6] bg-white shadow-[0_14px_40px_rgba(0,0,0,0.14)]"
            }
        >
            {isMobile && (
                <div className="flex h-12 items-center justify-between border-b border-[#ededed] px-4">
                    <span className="text-[14px] font-semibold text-[#171717]">
                        Действия
                    </span>

                    <button
                        type="button"
                        onClick={closeMenu}
                        aria-label="Закрыть"
                        className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[#777777] hover:bg-[#f3f3f3]"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            )}

            <div className="p-1.5">
                <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[14px] text-[#202020] transition-colors hover:bg-[#f5f5f5]"
                >
                    <span className="min-w-0 flex-1">
                        {copied
                            ? "Ссылка скопирована"
                            : "Копировать ссылку"}
                    </span>

                    {copied ? (
                        <Check className="size-[19] text-main-green" strokeWidth={1.7} />
                    ) : (
                        <Link2 className="size-[19] text-[#616161]" strokeWidth={1.6} />
                    )}
                </button>

                <button
                    type="button"
                    onClick={closeMenu}
                    className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[14px] text-[#202020] transition-colors hover:bg-[#f5f5f5]"
                >
                    <span className="min-w-0 flex-1">
                        Об этом профиле
                    </span>

                    <CircleAlert className="size-[19] text-[#616161]" strokeWidth={1.6} />
                </button>

                <button
                    type="button"
                    onClick={closeMenu}
                    className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[14px] text-[#202020] transition-colors hover:bg-[#f5f5f5]"
                >
                    <span className="min-w-0 flex-1">
                        Добавить в радар
                    </span>

                    <ChevronRight className="size-[18] text-[#616161]" strokeWidth={1.6} />
                </button>
            </div>

            {!isOwnProfile && (
                <>
                    <div className="border-t border-[#e7e7e7] p-1.5">
                        <button
                            type="button"
                            onClick={closeMenu}
                            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[14px] text-[#202020] transition-colors hover:bg-[#f5f5f5]"
                        >
                            <span className="min-w-0 flex-1">
                                Скрыть пользователя
                            </span>

                            <EyeOff className="size-[19] text-[#616161]" strokeWidth={1.6} />
                        </button>

                        <button
                            type="button"
                            onClick={closeMenu}
                            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[14px] text-[#202020] transition-colors hover:bg-[#f5f5f5]"
                        >
                            <span className="min-w-0 flex-1">
                                Установить ограничения
                            </span>

                            <UserRoundMinus className="size-[19] text-[#616161]" strokeWidth={1.6} />
                        </button>
                    </div>

                    <div className="border-t border-[#e7e7e7] p-1.5">
                        <button
                            type="button"
                            onClick={closeMenu}
                            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl bg-[#fff0f0] px-3 text-left text-[14px] font-medium text-[#ff2b35] transition-colors hover:bg-[#ffe6e6]"
                        >
                            <span className="min-w-0 flex-1">
                                Заблокировать
                            </span>

                            <Ban className="size-[19]" strokeWidth={1.7} />
                        </button>

                        <button
                            type="button"
                            onClick={closeMenu}
                            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium text-[#ff2b35] transition-colors hover:bg-[#fff4f4]"
                        >
                            <span className="min-w-0 flex-1">
                                Пожаловаться
                            </span>

                            <MessageCircleWarning className="size-[19]" strokeWidth={1.7} />
                        </button>
                    </div>
                </>
            )}
        </div>
    )

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-label="Ещё"
                aria-expanded={isOpen}
                className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-white transition-colors ${isOpen ? "border-[#d5d5d5] bg-[#f5f5f5] text-[#171717]" : "border-[#e3e3e3] text-[#616161] hover:bg-[#f5f5f5]"}`}
            >
                <MoreHorizontal className="size-5" strokeWidth={1.6} />
            </button>

            {isMounted &&
                isOpen &&
                createPortal(
                    <>
                        {isMobile && (
                            <button
                                type="button"
                                aria-label="Закрыть меню"
                                onClick={closeMenu}
                                className="fixed inset-0 z-200 cursor-default bg-black/30 backdrop-blur-[2px]"
                            />
                        )}

                        {menu}
                    </>,
                    document.body
                )}
        </>
    )
}

export default ProfileMoreMenu