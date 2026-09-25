"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
    interests: string[]
}

const VISIBLE_COUNT = 4

function ProfileInterests({
    interests
}: Props) {
    const [isOpen, setIsOpen] =
        useState(false)

    const [isMounted, setIsMounted] =
        useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const previousOverflow =
            document.body.style.overflow

        document.body.style.overflow =
            "hidden"

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        )

        return () => {
            document.body.style.overflow =
                previousOverflow

            window.removeEventListener(
                "keydown",
                handleKeyDown
            )
        }
    }, [isOpen])

    if (interests.length === 0) {
        return null
    }

    const visibleInterests =
        interests.slice(
            0,
            VISIBLE_COUNT
        )

    const hiddenCount =
        Math.max(
            0,
            interests.length -
                VISIBLE_COUNT
        )

    return (
        <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                {visibleInterests.map(
                    (interest) => (
                        <span
                            key={interest}
                            className="flex h-9 max-w-[180] items-center truncate rounded-xl border border-[#e5e5e5] bg-white px-3.5 text-[12px] font-medium text-[#666]"
                        >
                            {interest}
                        </span>
                    )
                )}

                {hiddenCount > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            setIsOpen(true)
                        }
                        className="flex h-9 cursor-pointer items-center rounded-xl border border-[#e5e5e5] bg-white px-3.5 text-[12px] font-medium text-[#777] transition-colors hover:bg-[#f5f5f5] hover:text-[#222]"
                    >
                        +{hiddenCount}
                    </button>
                )}
            </div>

            {isMounted &&
                isOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-200 flex items-end justify-center bg-black/30 backdrop-blur-[2px] sm:items-center sm:p-5"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setIsOpen(
                                    false
                                )
                            }
                        }}
                    >
                        <div className="w-full overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.20)] sm:max-w-[440] sm:rounded-3xl">
                            <div className="flex h-16 items-center justify-between border-b border-[#ededed] px-5">
                                <div>
                                    <div className="text-[17px] font-bold text-[#171717]">
                                        Интересы
                                    </div>

                                    <div className="mt-0.5 text-[11px] text-[#999]">
                                        {interests.length} интересов
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsOpen(
                                            false
                                        )
                                    }
                                    aria-label="Закрыть"
                                    className="flex size-9 cursor-pointer items-center justify-center rounded-full text-[#777] transition-colors hover:bg-[#f2f2f2] hover:text-[#222]"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="flex max-h-[60dvh] flex-wrap content-start gap-2 overflow-y-auto p-5">
                                {interests.map(
                                    (interest) => (
                                        <span
                                            key={interest}
                                            className="flex min-h-9 max-w-full items-center rounded-xl bg-[#f2f4f2] px-3.5 py-2 text-[13px] font-medium text-[#555]"
                                        >
                                            <span className="wrap-break-word">
                                                {interest}
                                            </span>
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    )
}

export default ProfileInterests