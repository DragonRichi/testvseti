"use client"

import { createTrackingRadar } from "@/actions/createTrackingRadar"
import { LoaderCircle, MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import type { RadarPoint } from "./TrackingRadarMap"

const TrackingRadarMap = dynamic(() => import("./TrackingRadarMap"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[420] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-main-gray sm:h-[500]">
            Загрузка карты...
        </div>
    )
})

type RadiusM = 3000 | 6000 | 9000 | 12000
type SortMode = "nearest" | "latest" | "popular" | "discussed"

const radiusOptions: { value: RadiusM; label: string }[] = [
    {
        value: 3000,
        label: "3 км"
    },
    {
        value: 6000,
        label: "6 км"
    },
    {
        value: 9000,
        label: "9 км"
    },
    {
        value: 12000,
        label: "12 км"
    }
]

const sortOptions: { value: SortMode; label: string }[] = [
    {
        value: "latest",
        label: "Сначала новые"
    },
    {
        value: "nearest",
        label: "Сначала ближайшие"
    },
    {
        value: "popular",
        label: "Популярные"
    },
    {
        value: "discussed",
        label: "Обсуждаемые"
    }
]

function CreateTrackingRadar() {
    const router = useRouter()

    const [name, setName] = useState("")
    const [point, setPoint] = useState<RadarPoint | null>(null)
    const [radiusM, setRadiusM] = useState<RadiusM>(3000)
    const [sortMode, setSortMode] = useState<SortMode>("latest")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = () => {
        if (!name.trim()) {
            setError("Введите название радара")
            return
        }

        if (!point) {
            setError("Выберите точку на карте")
            return
        }

        setError(null)

        startTransition(async () => {
            const result = await createTrackingRadar({
                name,
                sortMode,
                latitude: point.latitude,
                longitude: point.longitude,
                radiusM
            })

            if (result.success === false) {
                setError(result.error)
                return
            }

            router.push("/feed")
            router.refresh()
        })
    }

    return (
        <div className="rounded-3xl border border-green-100 bg-white p-5 sm:p-7">
            <div>
                <h1 className="text-xl font-bold text-gray-900">
                    Радар слежения
                </h1>

                <p className="mt-1 text-sm leading-6 text-main-gray">
                    Выберите точку на карте и радиус. В радар попадут публикации из выбранной области.
                </p>
            </div>

            <div className="mt-7">
                <label className="text-sm font-semibold text-gray-900">
                    Название
                </label>

                <input type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Например, Центр Бреста" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-main-green" />
            </div>

            <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            Область слежения
                        </div>

                        <div className="mt-1 text-xs text-main-gray">
                            Нажмите на карту, чтобы выбрать центр радара
                        </div>
                    </div>

                    {point && (
                        <div className="hidden items-center gap-1.5 text-xs text-main-gray sm:flex">
                            <MapPin className="size-4" />
                            {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                        </div>
                    )}
                </div>

                <div className="mt-3">
                    <TrackingRadarMap point={point} radiusM={radiusM} onPointChange={setPoint} />
                </div>

                {point && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-main-gray sm:hidden">
                        <MapPin className="size-4" />
                        {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                    </div>
                )}
            </div>

            <div className="mt-6">
                <div className="text-sm font-semibold text-gray-900">
                    Радиус
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {radiusOptions.map((option) => (
                        <button key={option.value} type="button" onClick={() => setRadiusM(option.value)} className={`h-11 cursor-pointer rounded-xl border text-sm font-medium transition-colors ${radiusM === option.value ? "border-main-green bg-green-50 text-main-green" : "border-gray-200 text-gray-700 hover:border-green-200 hover:bg-green-50"}`}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <div className="text-sm font-semibold text-gray-900">
                    Сортировка
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => (
                        <button key={option.value} type="button" onClick={() => setSortMode(option.value)} className={`min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${sortMode === option.value ? "border-main-green bg-green-50 text-main-green" : "border-gray-200 text-gray-700 hover:border-green-200 hover:bg-green-50"}`}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                    {error}
                </div>
            )}

            <div className="mt-7 flex justify-end">
                <button type="button" onClick={handleSubmit} disabled={isPending} className="flex h-11 min-w-[170] cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-5 text-sm font-semibold text-white transition-colors hover:bg-hover-green disabled:cursor-not-allowed disabled:opacity-60">
                    {isPending && <LoaderCircle className="size-4 animate-spin" />}
                    {isPending ? "Создание..." : "Создать радар"}
                </button>
            </div>
        </div>
    )
}

export default CreateTrackingRadar