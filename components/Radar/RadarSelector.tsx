"use client"

import { ChevronDown, Plus, Radar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { UserRadar } from "@/lib/radars/getUserRadars"

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

    return (
        <div className="relative flex items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1">
                <button type="button" onClick={() => setIsOpen((value) => !value)} className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-green-100 bg-white px-4 text-left transition-colors hover:bg-green-50">
                    <Radar className="size-5 shrink-0 text-main-green" />

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-gray-900">
                            {activeRadar?.name ?? "Все публикации"}
                        </div>

                        <div className="truncate text-xs text-main-gray">
                            {activeRadar ? activeRadar.type === "publications" ? "Публикации" : "Слежение" : "Общая лента"}
                        </div>
                    </div>

                    <ChevronDown className={`size-4 shrink-0 text-main-gray transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <div className="absolute left-0 right-0 top-[48] z-40 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-xl">
                        <button type="button" onClick={() => { setIsOpen(false); router.push("/feed") }} className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50 ${activeRadarId === null ? "bg-green-50" : ""}`}>
                            <Radar className="size-4 shrink-0 text-main-green" />

                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-gray-900">
                                    Все публикации
                                </div>

                                <div className="text-xs text-main-gray">
                                    Общая лента
                                </div>
                            </div>
                        </button>

                        {radars.map((radar) => (
                            <button key={radar.id} type="button" onClick={() => handleSelect(radar.id)} className={`flex w-full cursor-pointer items-center gap-3 border-t border-gray-100 px-4 py-3 text-left transition-colors hover:bg-green-50 ${activeRadarId === radar.id ? "bg-green-50" : ""}`}>
                                <Radar className="size-4 shrink-0 text-main-green" />

                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                        {radar.name}
                                    </div>

                                    <div className="text-xs text-main-gray">
                                        {radar.type === "publications" ? "Публикации" : "Слежение"}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {radars.length === 0 && (
                            <div className="border-t border-gray-100 px-4 py-4 text-center text-sm text-main-gray">
                                У вас пока нет радаров
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Link href="/radars/new" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-main-green text-white transition-colors hover:bg-hover-green" aria-label="Создать радар">
                <Plus className="size-5" />
            </Link>
        </div>
    )
}

export default RadarSelector