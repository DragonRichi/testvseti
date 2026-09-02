"use client"

import type { UserRadar } from "@/lib/radars/getUserRadars"
import { ChevronDown, MapPin, Plus, Radar, UsersRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
    radars: UserRadar[]
    activeRadarId: string | null
}

function RadarSelector({ radars, activeRadarId }: Props) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    const activeRadar = radars.find((radar) => radar.id === activeRadarId) ?? null

    const handleSelect = (radarId: string) => {
        setIsOpen(false)
        router.push(`/feed?radar=${radarId}`)
    }

    const handleGeoFeed = () => {
        setIsOpen(false)
        router.push("/feed")
    }

    return (
        <div className="relative flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
                <button type="button" onClick={() => setIsOpen((value) => !value)} className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 text-left transition-colors hover:bg-green-50">
                    {activeRadar ? (
                        activeRadar.type === "tracking" ? (
                            <MapPin className="size-5 shrink-0 text-main-green" />
                        ) : (
                            <UsersRound className="size-5 shrink-0 text-main-green" />
                        )
                    ) : (
                        <Radar className="size-5 shrink-0 text-main-green" />
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-gray-900">
                            {activeRadar?.name ?? "Рядом"}
                        </div>

                        <div className="truncate text-xs text-main-gray">
                            {activeRadar ? activeRadar.type === "publications" ? "Радар публикаций" : "Радар слежения" : "Лента по геолокации"}
                        </div>
                    </div>

                    <ChevronDown className={`size-4 shrink-0 text-main-gray transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <>
                        <button type="button" aria-label="Закрыть список радаров" onClick={() => setIsOpen(false)} className="fixed inset-0 z-30 cursor-default" />

                        <div className="absolute left-0 right-0 top-[56] z-40 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-xl">
                            <button type="button" onClick={handleGeoFeed} className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50 ${activeRadarId === null ? "bg-green-50" : ""}`}>
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-main-green">
                                    <Radar className="size-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-gray-900">
                                        Рядом
                                    </div>

                                    <div className="text-xs text-main-gray">
                                        Публикации по вашей геолокации
                                    </div>
                                </div>
                            </button>

                            <div className="border-t border-gray-100 px-4 pb-2 pt-3">
                                <div className="text-xs font-semibold uppercase tracking-wide text-main-gray">
                                    Мои радары
                                </div>
                            </div>

                            {radars.length > 0 ? (
                                <div className="max-h-[320] overflow-y-auto">
                                    {radars.map((radar) => {
                                        const isActive = radar.id === activeRadarId
                                        const Icon = radar.type === "tracking" ? MapPin : UsersRound

                                        return (
                                            <button key={radar.id} type="button" onClick={() => handleSelect(radar.id)} className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50 ${isActive ? "bg-green-50" : ""}`}>
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-main-green">
                                                    <Icon className="size-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium text-gray-900">
                                                        {radar.name}
                                                    </div>

                                                    <div className="text-xs text-main-gray">
                                                        {radar.type === "publications" ? "Публикации" : "Слежение"}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="px-4 pb-4 pt-2 text-sm text-main-gray">
                                    Вы ещё не создали ни одного радара
                                </div>
                            )}

                            <div className="border-t border-gray-100 p-2">
                                <Link href="/radars/new" onClick={() => setIsOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-main-green transition-colors hover:bg-green-50">
                                    <Plus className="size-4" />
                                    Создать радар
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Link href="/radars/new" aria-label="Создать радар" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-main-green text-white transition-colors hover:bg-hover-green">
                <Plus className="size-5" />
            </Link>
        </div>
    )
}

export default RadarSelector