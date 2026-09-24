"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

type Props = {
    mediaUrls: string[]
    eager?: boolean
}

function PostMediaGrid({
    mediaUrls,
    eager = false
}: Props) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [stripIndex, setStripIndex] = useState(0)
    const touchStartX = useRef<number | null>(null)

    const isViewerOpen = activeIndex !== null

    const closeViewer = () => {
        setActiveIndex(null)
    }

    const showPrevious = () => {
        setActiveIndex((current) => {
            if (current === null) return null
            return (current - 1 + mediaUrls.length) % mediaUrls.length
        })
    }

    const showNext = () => {
        setActiveIndex((current) => {
            if (current === null) return null
            return (current + 1) % mediaUrls.length
        })
    }

    const handleTouchStart = (
        event: React.TouchEvent<HTMLDivElement>
    ) => {
        touchStartX.current =
            event.touches[0]?.clientX ?? null
    }

    const handleTouchEnd = (
        event: React.TouchEvent<HTMLDivElement>
    ) => {
        if (touchStartX.current === null) return

        const touchEndX =
            event.changedTouches[0]?.clientX

        if (touchEndX === undefined) return

        const difference =
            touchStartX.current - touchEndX

        if (Math.abs(difference) > 50) {
            if (difference > 0) {
                showNext()
            } else {
                showPrevious()
            }
        }

        touchStartX.current = null
    }

    const handleStripScroll = (
        event: React.UIEvent<HTMLDivElement>
    ) => {
        const container =
            event.currentTarget

        const firstItem =
            container.firstElementChild as HTMLElement | null

        if (!firstItem) return

        const gap = 4
        const step =
            firstItem.offsetWidth + gap

        if (step <= 0) return

        const nextIndex = Math.min(
            mediaUrls.length - 1,
            Math.max(
                0,
                Math.round(
                    container.scrollLeft / step
                )
            )
        )

        setStripIndex(nextIndex)
    }

    useEffect(() => {
        if (!isViewerOpen) return

        const previousOverflow =
            document.body.style.overflow

        document.body.style.overflow =
            "hidden"

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                closeViewer()
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
        isViewerOpen,
        mediaUrls.length
    ])

    if (mediaUrls.length === 0) {
        return null
    }

    const renderImage = (
        url: string,
        index: number,
        className: string,
        sizes: string
    ) => (
        <button
            key={`${url}-${index}`}
            type="button"
            onClick={() =>
                setActiveIndex(index)
            }
            className={className}
        >
            <Image
                src={url}
                alt={`Фото публикации ${index + 1}`}
                fill
                sizes={sizes}
                priority={
                    eager &&
                    index === 0
                }
                unoptimized={
                    process.env.NODE_ENV ===
                    "development"
                }
                className="object-cover transition-transform duration-200 hover:scale-[1.015]"
            />
        </button>
    )

    const renderMedia = () => {
        if (mediaUrls.length === 1) {
            return renderImage(
                mediaUrls[0],
                0,
                "relative block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[10px] bg-[#eeeeee]",
                "(max-width: 768px) 100vw, 650px"
            )
        }

        if (mediaUrls.length === 2) {
            return (
                <div className="grid grid-cols-2 gap-1">
                    {mediaUrls.map(
                        (url, index) =>
                            renderImage(
                                url,
                                index,
                                "relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[9px] bg-[#eeeeee]",
                                "(max-width: 768px) 50vw, 320px"
                            )
                    )}
                </div>
            )
        }

        if (mediaUrls.length === 3) {
            return (
                <div className="grid grid-cols-3 gap-1">
                    {mediaUrls.map(
                        (url, index) =>
                            renderImage(
                                url,
                                index,
                                "relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[9px] bg-[#eeeeee]",
                                "(max-width: 768px) 33vw, 220px"
                            )
                    )}
                </div>
            )
        }

        return (
            <div>
                <div className="mb-2 flex">
                    <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[11px] leading-4 text-[#999999]">
                        {stripIndex + 1}/{mediaUrls.length}
                    </span>
                </div>

                <div
                    onScroll={handleStripScroll}
                    style={{
                        gridAutoColumns:
                            "calc((100% - 12px) / 4)"
                    }}
                    className="grid snap-x snap-mandatory grid-flow-col gap-1 overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
                >
                    {mediaUrls.map(
                        (url, index) =>
                            renderImage(
                                url,
                                index,
                                "relative aspect-[3/4] w-full snap-start cursor-pointer overflow-hidden rounded-[9px] bg-[#eeeeee]",
                                "(max-width: 768px) 25vw, 170px"
                            )
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
            {renderMedia()}

            {activeIndex !== null && (
                <div className="fixed inset-0 z-100 flex bg-black/95" role="dialog" aria-modal="true">
                    <button type="button" onClick={closeViewer} aria-label="Закрыть" className="absolute right-3 top-3 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/15 sm:right-5 sm:top-5">
                        <X className="size-6" />
                    </button>

                    <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white sm:top-5 sm:text-sm">
                        {activeIndex + 1} / {mediaUrls.length}
                    </div>

                    {mediaUrls.length > 1 && (
                        <button type="button" onClick={showPrevious} aria-label="Предыдущее фото" className="absolute left-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/15 sm:flex">
                            <ChevronLeft className="size-7" />
                        </button>
                    )}

                    <div className="relative flex min-h-0 w-full flex-1 items-center justify-center px-2 py-14 sm:px-16 sm:py-16" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        <div className="relative h-full w-full">
                            <Image src={mediaUrls[activeIndex]} alt={`Фото публикации ${activeIndex + 1}`} fill priority sizes="100vw" unoptimized={process.env.NODE_ENV === "development"} className="select-none object-contain" />
                        </div>
                    </div>

                    {mediaUrls.length > 1 && (
                        <button type="button" onClick={showNext} aria-label="Следующее фото" className="absolute right-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/15 sm:flex">
                            <ChevronRight className="size-7" />
                        </button>
                    )}
                </div>
            )}
        </>
    )
}

export default PostMediaGrid