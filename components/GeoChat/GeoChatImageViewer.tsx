"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

type Props = {
    urls: string[]
    activeIndex: number | null
    onChange: (index: number) => void
    onClose: () => void
}

function GeoChatImageViewer({
    urls,
    activeIndex,
    onChange,
    onClose
}: Props) {
    const touchStartX = useRef<number | null>(null)

    const showPrevious = useCallback(() => {
        if (activeIndex === null || urls.length === 0) return

        onChange(
            (activeIndex - 1 + urls.length) %
                urls.length
        )
    }, [
        activeIndex,
        onChange,
        urls.length
    ])

    const showNext = useCallback(() => {
        if (activeIndex === null || urls.length === 0) return

        onChange(
            (activeIndex + 1) %
                urls.length
        )
    }, [
        activeIndex,
        onChange,
        urls.length
    ])

    useEffect(() => {
        if (activeIndex === null) return

        const previousOverflow =
            document.body.style.overflow

        document.body.style.overflow =
            "hidden"

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                onClose()
            }

            if (event.key === "ArrowLeft") {
                showPrevious()
            }

            if (event.key === "ArrowRight") {
                showNext()
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
    }, [
        activeIndex,
        onClose,
        showNext,
        showPrevious
    ])

    if (
        activeIndex === null ||
        urls.length === 0 ||
        typeof document === "undefined"
    ) {
        return null
    }

    const handleTouchStart = (
        event: React.TouchEvent<HTMLDivElement>
    ) => {
        touchStartX.current =
            event.touches[0]?.clientX ??
            null
    }

    const handleTouchEnd = (
        event: React.TouchEvent<HTMLDivElement>
    ) => {
        if (
            touchStartX.current === null
        ) {
            return
        }

        const touchEndX =
            event.changedTouches[0]
                ?.clientX

        if (touchEndX === undefined) {
            return
        }

        const difference =
            touchStartX.current -
            touchEndX

        if (
            Math.abs(difference) > 50
        ) {
            if (difference > 0) {
                showNext()
            } else {
                showPrevious()
            }
        }

        touchStartX.current = null
    }

    const viewer = (
        <div className="fixed inset-0 z-200 flex bg-black/95" role="dialog" aria-modal="true">
            <button type="button" onClick={onClose} aria-label="Закрыть" className="absolute right-3 top-3 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/15 sm:right-5 sm:top-5">
                <X className="size-6" />
            </button>

            <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white sm:top-5 sm:text-sm">
                {activeIndex + 1} /{" "}
                {urls.length}
            </div>

            {urls.length > 1 && (
                <button type="button" onClick={showPrevious} aria-label="Предыдущее фото" className="absolute left-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/15 sm:flex">
                    <ChevronLeft className="size-7" />
                </button>
            )}

            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center px-2 py-14 sm:px-16 sm:py-16" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div className="relative h-full w-full">
                    <Image
                        src={
                            urls[
                                activeIndex
                            ]
                        }
                        alt={`Изображение ${activeIndex + 1}`}
                        fill
                        sizes="100vw"
                        loading="eager"
                        unoptimized
                        className="select-none object-contain"
                    />
                </div>
            </div>

            {urls.length > 1 && (
                <button type="button" onClick={showNext} aria-label="Следующее фото" className="absolute right-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/15 sm:flex">
                    <ChevronRight className="size-7" />
                </button>
            )}

            {urls.length > 1 && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60 sm:hidden">
                    Смахните для просмотра
                </div>
            )}
        </div>
    )

    return createPortal(
        viewer,
        document.body
    )
}

export default GeoChatImageViewer