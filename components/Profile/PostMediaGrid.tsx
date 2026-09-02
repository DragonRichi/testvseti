"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

type Props = {
    mediaUrls: string[]
    eager?: boolean
}

function PostMediaGrid({ mediaUrls, eager = false }: Props) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const touchStartX = useRef<number | null>(null)

    const isViewerOpen = activeIndex !== null

    const openViewer = (index: number) => {
        setActiveIndex(index)
    }

    const closeViewer = () => {
        setActiveIndex(null)
    }

    const showPrevious = () => {
        if (activeIndex === null) return

        setActiveIndex((activeIndex - 1 + mediaUrls.length) % mediaUrls.length)
    }

    const showNext = () => {
        if (activeIndex === null) return

        setActiveIndex((activeIndex + 1) % mediaUrls.length)
    }

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
    }

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null) return

        const touchEndX = event.changedTouches[0]?.clientX

        if (touchEndX === undefined) return

        const difference = touchStartX.current - touchEndX

        if (Math.abs(difference) > 50) {
            if (difference > 0) {
                showNext()
            } else {
                showPrevious()
            }
        }

        touchStartX.current = null
    }

    useEffect(() => {
        if (!isViewerOpen) return

        const previousOverflow = document.body.style.overflow

        document.body.style.overflow = "hidden"

        const handleKeyDown = (event: KeyboardEvent) => {
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

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isViewerOpen, activeIndex])

    if (mediaUrls.length === 0) return null

    const visibleMedia = mediaUrls.slice(0, 4)
    const remainingCount = mediaUrls.length - 4

    const renderMedia = () => {
        if (mediaUrls.length === 1) {
            return (
                <button type="button" onClick={() => openViewer(0)} className="relative mt-4 block aspect-16/10 w-full cursor-pointer overflow-hidden rounded-2xl bg-gray-100">
                    <Image
                        src={mediaUrls[0]}
                        alt="Фото публикации"
                        fill
                        sizes="(max-width: 768px) 100vw, 800px" unoptimized={process.env.NODE_ENV === "development"}
                        className="object-cover transition-transform duration-200 hover:scale-[1.01]"
                        loading={eager ? "eager" : "lazy"}
                    />
                </button>
            )
        }

        if (mediaUrls.length === 2) {
            return (
                <div className="mt-4 grid grid-cols-2 gap-1 overflow-hidden rounded-2xl">
                    {mediaUrls.map((url, index) => (
                        <button key={url} type="button" onClick={() => openViewer(index)} className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100">
                            <Image
                                src={url}
                                alt={`Фото публикации ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 400px" unoptimized={process.env.NODE_ENV === "development"}
                                className="object-cover transition-transform duration-200 hover:scale-[1.02]"
                                loading={eager && index === 0 ? "eager" : "lazy"}

                            />
                        </button>
                    ))}
                </div>
            )
        }

        if (mediaUrls.length === 3) {
            return (
                <div className="mt-4 grid h-[260] grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl sm:h-[380]">
                    <button type="button" onClick={() => openViewer(0)} className="relative row-span-2 cursor-pointer overflow-hidden bg-gray-100">
                        <Image src={mediaUrls[0]} alt="Фото публикации 1" fill sizes="(max-width: 768px) 50vw, 350px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover transition-transform duration-200 hover:scale-[1.02]" />
                    </button>

                    <button type="button" onClick={() => openViewer(1)} className="relative cursor-pointer overflow-hidden bg-gray-100">
                        <Image src={mediaUrls[1]} alt="Фото публикации 2" fill sizes="(max-width: 768px) 50vw, 350px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover transition-transform duration-200 hover:scale-[1.02]" />
                    </button>

                    <button type="button" onClick={() => openViewer(2)} className="relative cursor-pointer overflow-hidden bg-gray-100">
                        <Image src={mediaUrls[2]} alt="Фото публикации 3" fill sizes="(max-width: 768px) 50vw, 350px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover transition-transform duration-200 hover:scale-[1.02]" />
                    </button>
                </div>
            )
        }

        return (
            <div className="mt-4 grid grid-cols-2 gap-1 overflow-hidden rounded-2xl">
                {visibleMedia.map((url, index) => (
                    <button key={url} type="button" onClick={() => openViewer(index)} className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100">
                        <Image src={url} alt={`Фото публикации ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 350px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover transition-transform duration-200 hover:scale-[1.02]" />

                        {index === 3 && remainingCount > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-bold text-white sm:text-3xl">
                                +{remainingCount}
                            </div>
                        )}
                    </button>
                ))}
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

                    {mediaUrls.length > 1 && (
                        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60 sm:hidden">
                            Смахните для просмотра
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default PostMediaGrid