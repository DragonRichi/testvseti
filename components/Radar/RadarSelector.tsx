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
        <div className="relative flex items-center gap-2 rounded-[16px] bg-white px-3 py-2 shadow-[0_1px_0_rgba(18,24,18,0.04)] sm:px-4">
            <div className="relative min-w-0 flex-1">
                <button type="button" onClick={() => setIsOpen((value) => !value)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-[12px] px-1 text-left transition-colors hover:bg-[#f6f8f5]">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ebf9ed] text-main-green">
                        {activeRadar ? activeRadar.type === "tracking" ? <MapPin className="size-4" /> : <UsersRound className="size-4" /> : <Radar className="size-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#171b17]">{activeRadar?.name ?? "Рядом"}</div>
                        <div className="truncate text-[11px] text-[#969b97]">{activeRadar ? activeRadar.type === "publications" ? "Радар публикаций" : "Радар слежения" : "Публикации по геолокации"}</div>
                    </div>

                    <ChevronDown className={`size-4 shrink-0 text-[#909690] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <>
                        <button type="button" aria-label="Закрыть список радаров" onClick={() => setIsOpen(false)} className="fixed inset-0 z-30 cursor-default" />

                        <div className="absolute left-0 right-0 top-[48] z-40 overflow-hidden rounded-[16px] border border-[#e5e9e4] bg-white py-1 shadow-[0_18px_50px_rgba(20,28,21,0.14)]">
                            <button type="button" onClick={handleGeoFeed} className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f3f8f3] ${activeRadarId === null ? "bg-[#eef8ef]" : ""}`}>
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ebf9ed] text-main-green"><Radar className="size-4" /></div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-[#171b17]">Рядом</div>
                                    <div className="text-[11px] text-[#8c928d]">Публикации по вашей геолокации</div>
                                </div>
                            </button>

                            {radars.length > 0 && <div className="mx-3 my-1 border-t border-[#eef0ed]" />}

                            <div className="max-h-[300] overflow-y-auto">
                                {radars.map((radar) => {
                                    const isActive = radar.id === activeRadarId
                                    const Icon = radar.type === "tracking" ? MapPin : UsersRound

                                    return (
                                        <button key={radar.id} type="button" onClick={() => handleSelect(radar.id)} className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f3f8f3] ${isActive ? "bg-[#eef8ef]" : ""}`}>
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f0f5ef] text-main-green"><Icon className="size-4" /></div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-[#171b17]">{radar.name}</div>
                                                <div className="text-[11px] text-[#8c928d]">{radar.type === "publications" ? "Публикации" : "Слежение"}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="mx-3 border-t border-[#eef0ed]" />
                            <Link href="/radars/new" onClick={() => setIsOpen(false)} className="mx-1 mt-1 flex h-10 items-center justify-center gap-2 rounded-[12px] text-sm font-semibold text-main-green transition-colors hover:bg-[#eef8ef]">
                                <Plus className="size-4" />
                                Создать радар
                            </Link>
                        </div>
                    </>
                )}
            </div>

            <Link href="/radars/new" aria-label="Создать радар" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#171b17] text-white transition-transform hover:scale-[1.03]">
                <Plus className="size-4" />
            </Link>
        </div>
    )
}

export default RadarSelector
