"use client"

import type { UserRadar } from "@/lib/radars/getUserRadars"
import { ChevronDown, MapPin, Plus, Radar, UsersRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type Props = {
    radars: UserRadar[]
    activeRadarId: string | null
}

function FeedRadarMenu({
    radars,
    activeRadarId
}: Props) {
    const router = useRouter()
    const rootRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    const activeRadar = radars.find((radar) => radar.id === activeRadarId) ?? null

    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (event: PointerEvent) => {
            if (rootRef.current?.contains(event.target as Node)) return
            setIsOpen(false)
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen])

    const selectGeoFeed = () => {
        setIsOpen(false)
        router.push("/feed")
    }

    const selectRadar = (radarId: string) => {
        setIsOpen(false)
        router.push(`/feed?radar=${radarId}`)
    }

    return (
        <div ref={rootRef} className="relative flex h-full items-center">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className={`relative flex h-full cursor-pointer items-center gap-1.5 px-5 text-[15px] font-medium transition-colors ${activeRadarId ? "text-[#171717]" : "text-[#8b918c] hover:text-[#555]"}`}
            >
                <span className="max-w-[180] truncate">
                    {activeRadar?.name ?? "Рядом"}
                </span>

                <ChevronDown className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.7} />

                {activeRadarId && (
                    <span className="absolute inset-x-5 bottom-0 h-[2] rounded-full bg-main-green" />
                )}
            </button>

            {isOpen && (
                <div className="absolute left-3 top-[52] z-100 w-[270] overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white py-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.10)]">
                    <button
                        type="button"
                        onClick={selectGeoFeed}
                        className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f5f5] ${activeRadarId === null ? "bg-[#f4f4f4]" : ""}`}
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecf8ef] text-main-green">
                            <Radar className="size-[18]" strokeWidth={1.7} />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-semibold text-[#202020]">
                                Рядом
                            </span>

                            <span className="mt-0.5 block truncate text-[11px] text-[#999999]">
                                Публикации по геолокации
                            </span>
                        </span>
                    </button>

                    {radars.length > 0 && (
                        <div className="mx-3 my-1 border-t border-[#ededed]" />
                    )}

                    <div className="max-h-[300] overflow-y-auto">
                        {radars.map((radar) => {
                            const isActive = radar.id === activeRadarId
                            const Icon = radar.type === "tracking" ? MapPin : UsersRound

                            return (
                                <button
                                    key={radar.id}
                                    type="button"
                                    onClick={() => selectRadar(radar.id)}
                                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f5f5] ${isActive ? "bg-[#f4f4f4]" : ""}`}
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1f4f1] text-main-green">
                                        <Icon className="size-[18]" strokeWidth={1.7} />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[14px] font-medium text-[#202020]">
                                            {radar.name}
                                        </span>

                                        <span className="mt-0.5 block text-[11px] text-[#999999]">
                                            {radar.type === "publications" ? "Радар публикаций" : "Радар слежения"}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mx-3 my-1 border-t border-[#ededed]" />

                    <Link
                        href="/radars/new"
                        onClick={() => setIsOpen(false)}
                        className="mx-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-[#202020] transition-colors hover:bg-[#f5f5f5]"
                    >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f1f1f1] text-[#616161]">
                            <Plus className="size-4" strokeWidth={1.7} />
                        </span>

                        <span>Создать радар</span>
                    </Link>
                </div>
            )}
        </div>
    )
}

export default FeedRadarMenu