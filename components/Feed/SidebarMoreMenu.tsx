"use client"

import LogoutButton from "@/components/Auth/LogoutButton"
import { ChevronRight, Moon, Settings, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
    mobile?: boolean
}

function SidebarMoreMenu({
    mobile = false
}: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (
            event: PointerEvent
        ) => {
            if (
                rootRef.current?.contains(
                    event.target as Node
                )
            ) {
                return
            }

            setIsOpen(false)
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        )

        document.addEventListener(
            "keydown",
            handleKeyDown
        )

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            )

            document.removeEventListener(
                "keydown",
                handleKeyDown
            )
        }
    }, [isOpen])

    return (
        <div
            ref={rootRef}
            className="relative w-full"
        >
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={() =>
                    setIsOpen(
                        (current) =>
                            !current
                    )
                }
                className="flex h-11 w-fit max-w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 text-[14px] font-medium text-[#616161] transition-colors hover:bg-[#ededed] hover:text-[#363636]"
            >
                <span className="flex size-6 shrink-0 flex-col justify-center gap-1.25">
                    <span className="block h-px w-[14] bg-current" />
                    <span className="block h-px w-[9] bg-current" />
                </span>

                <span>
                    Ещё
                </span>
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className={`absolute z-100 w-[240] overflow-hidden rounded-[18px] border border-[#e8e8e8] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)] ${mobile ? "bottom-full left-0 mb-2" : "bottom-0 left-full ml-3"}`}
                >
                    <div className="grid grid-cols-3 gap-1 p-1.5">
                        <button
                            type="button"
                            aria-label="Светлая тема"
                            className="flex h-[38] items-center justify-center rounded-[11px] bg-[#f2f2f2] text-[#616161]"
                        >
                            <Sun className="size-[18]" strokeWidth={1.5} />
                        </button>

                        <button
                            type="button"
                            aria-label="Тёмная тема"
                            className="flex h-[38] items-center justify-center rounded-[11px] text-[#616161] transition-colors hover:bg-[#f5f5f5]"
                        >
                            <Moon className="size-[18]" strokeWidth={1.5} />
                        </button>

                        <button
                            type="button"
                            className="flex h-[38] items-center justify-center rounded-[11px] border border-[#e8e8e8] bg-white px-2 text-[13px] font-medium text-main-green shadow-sm"
                        >
                            Авто
                        </button>
                    </div>

                    <button
                        type="button"
                        className="flex h-[46] w-full items-center justify-between px-4 text-left text-[14px] font-medium text-[#282828] transition-colors hover:bg-[#f7f7f7]"
                    >
                        <span>
                            Настройки
                        </span>

                        <Settings className="size-[19] text-[#777]" strokeWidth={1.5} />
                    </button>

                    <div className="border-t border-[#ededed] px-1.5 py-1.5">
                        <button
                            type="button"
                            className="flex h-[40] w-full items-center justify-between rounded-[11px] bg-[#f3f3f3] px-3 text-left text-[14px] font-medium text-[#252525]"
                        >
                            <span>
                                Ленты
                            </span>

                            <ChevronRight className="size-[17] text-[#777]" strokeWidth={1.6} />
                        </button>

                        <button
                            type="button"
                            className="flex h-[40] w-full items-center px-3 text-left text-[14px] text-[#252525] transition-colors hover:bg-[#f7f7f7]"
                        >
                            Вы сохранили
                        </button>

                        <button
                            type="button"
                            className="flex h-[40] w-full items-center px-3 text-left text-[14px] text-[#252525] transition-colors hover:bg-[#f7f7f7]"
                        >
                            Вы поставили &quot;Нравится&quot;
                        </button>
                    </div>

                    <div className="border-t border-[#ededed] px-1.5 py-1.5">
                        <button
                            type="button"
                            className="flex h-[40] w-full items-center px-3 text-left text-[14px] text-[#252525] transition-colors hover:bg-[#f7f7f7]"
                        >
                            Сообщить о проблеме
                        </button>

                        <LogoutButton variant="more" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default SidebarMoreMenu