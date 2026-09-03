"use client"

import { createGeoChat } from "@/actions/createGeoChat"
import type { GeoChatPoint, GeoChatRadius } from "@/types/geoChat"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"

const GeoChatMap = dynamic(() => import("@/components/GeoChat/GeoChatMap"), {
    ssr: false
})

type Props = {
    initialPoint: GeoChatPoint
}

const radii: { value: GeoChatRadius; label: string }[] = [
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

function CreateGeoChatForm({ initialPoint }: Props) {
    const router = useRouter()

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [point, setPoint] = useState<GeoChatPoint>(initialPoint)
    const [radiusM, setRadiusM] = useState<GeoChatRadius>(3000)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async () => {
        if (isSubmitting) return

        setError("")
        setIsSubmitting(true)

        try {
            const result = await createGeoChat(name, description, point.latitude, point.longitude, radiusM)

            if (result.success === false) {
                setError(result.error)
                return
            }

            router.push("/geochats")
            router.refresh()
        } catch (error) {
            console.error("CREATE GEO CHAT ERROR:", error)
            setError("Не удалось создать геочат")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
                <label className="block text-sm font-semibold text-gray-900">Название</label>

                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Например, Центр Гродно" className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-main-green" />

                <div className="mt-5 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">Описание</label>
                    <span className="text-xs text-main-gray">{description.length}/500</span>
                </div>

                <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="О чём этот геочат?" className="mt-2 min-h-[100] w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-main-green" />
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-gray-900">Радиус геочата</div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                    {radii.map((radius) => (
                        <button key={radius.value} type="button" onClick={() => setRadiusM(radius.value)} className={`h-10 cursor-pointer rounded-xl border text-sm font-medium transition-colors ${radiusM === radius.value ? "border-main-green bg-green-50 text-main-green" : "border-gray-200 bg-white text-main-gray hover:bg-gray-50"}`}>
                            {radius.label}
                        </button>
                    ))}
                </div>

                <div className="mt-5 text-sm font-semibold text-gray-900">Точка на карте</div>
                <div className="mt-1 text-xs leading-5 text-main-gray">Нажмите на карту, чтобы изменить центр геочата. Круг показывает территорию, на которой он будет доступен.</div>

                <div className="mt-4">
                    <GeoChatMap point={point} radiusM={radiusM} onPointChange={setPoint} />
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} disabled={isSubmitting} className="h-11 cursor-pointer rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Отмена
                </button>

                <button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting || !name.trim()} className="h-11 cursor-pointer rounded-xl bg-main-green px-6 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:cursor-not-allowed disabled:opacity-50">
                    {isSubmitting ? "Создаём..." : "Создать геочат"}
                </button>
            </div>
        </div>
    )
}

export default CreateGeoChatForm