"use client"

import { reverseGeocodePoint } from "@/actions/reverseGeocodePoint"
import { LoaderCircle, MapPin, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import type { PostLocationPoint } from "./PostLocationMap"

const PostLocationMap = dynamic(() => import("./PostLocationMap"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[360] items-center justify-center rounded-2xl bg-gray-50 text-sm text-main-gray sm:h-[420]">
            Загрузка карты...
        </div>
    )
})

export type SelectedPostLocation = {
    name: string
    latitude: number
    longitude: number
}

type Props = {
    value: SelectedPostLocation | null
    onChange: (location: SelectedPostLocation | null) => void
    variant?: "default" | "toolbar"
    disabled?: boolean
}

function PostLocationPicker({ value, onChange, variant = "default", disabled = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState(value?.name ?? "")
    const [point, setPoint] = useState<PostLocationPoint | null>(value ? {
        latitude: value.latitude,
        longitude: value.longitude
    } : null)
    const [isResolving, setIsResolving] = useState(false)
    const [locationError, setLocationError] = useState<string>("")

    const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const geocodeRequestRef = useRef(0)

    useEffect(() => {
        if (!isOpen) return

        setName(value?.name ?? "")
        setPoint(value ? {
            latitude: value.latitude,
            longitude: value.longitude
        } : null)
        setLocationError("")
        setIsResolving(false)
    }, [isOpen, value])

    useEffect(() => {
        if (!isOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isOpen])

    useEffect(() => {
        return () => {
            if (geocodeTimerRef.current) {
                clearTimeout(geocodeTimerRef.current)
            }
        }
    }, [])

    const handlePointChange = (nextPoint: PostLocationPoint) => {
        setPoint(nextPoint)
        setName("")
        setLocationError("")
        setIsResolving(true)

        geocodeRequestRef.current += 1

        const requestId = geocodeRequestRef.current

        if (geocodeTimerRef.current) {
            clearTimeout(geocodeTimerRef.current)
        }

        geocodeTimerRef.current = setTimeout(async () => {
            const result = await reverseGeocodePoint({
                latitude: nextPoint.latitude,
                longitude: nextPoint.longitude
            })

            if (requestId !== geocodeRequestRef.current) return

            setIsResolving(false)

            if (result.success === false) {
                setLocationError(result.error)
                return
            }

            setName(result.name)
        }, 700)
    }

    const handleClose = () => {
        geocodeRequestRef.current += 1

        if (geocodeTimerRef.current) {
            clearTimeout(geocodeTimerRef.current)
            geocodeTimerRef.current = null
        }

        setIsResolving(false)
        setIsOpen(false)
    }

    const handleApply = () => {
        const normalizedName = name.trim()

        if (!point || !normalizedName || isResolving) return

        onChange({
            name: normalizedName,
            latitude: point.latitude,
            longitude: point.longitude
        })

        setIsOpen(false)
    }

    return (
        <>
            {variant === "toolbar" ? (
                <button type="button" onClick={() => setIsOpen(true)} disabled={disabled} className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2 ${value ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <MapPin className="size-5" />
                    <span className="text-xs sm:text-sm">Место</span>
                </button>
            ) : value ? (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                    <MapPin className="size-4 shrink-0 text-main-green" />

                    <button type="button" onClick={() => setIsOpen(true)} disabled={disabled} className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-medium text-gray-700 disabled:cursor-not-allowed">
                        {value.name}
                    </button>

                    <button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label="Убрать место" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => setIsOpen(true)} disabled={disabled} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-main-gray transition-colors hover:text-main-green disabled:cursor-not-allowed disabled:opacity-50">
                    <MapPin className="size-5" />
                    Место
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[95vh] w-full max-w-[700] overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Указать место</h2>
                                <p className="mt-1 text-sm text-main-gray">Нажмите на нужное место на карте. Название определится автоматически.</p>
                            </div>

                            <button type="button" onClick={handleClose} aria-label="Закрыть" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-5">
                            <PostLocationMap point={point} onPointChange={handlePointChange} />
                        </div>

                        <div className="mt-4">
                            <label className="text-sm font-semibold text-gray-900">Место</label>

                            <div className="relative mt-2">
                                <input type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={isResolving ? "Определяем место..." : "Выберите точку на карте"} disabled={!point || isResolving} className="h-11 w-full rounded-xl border border-gray-200 px-4 pr-11 text-sm outline-none transition-colors focus:border-main-green disabled:bg-gray-50 disabled:text-main-gray" />

                                {isResolving && (
                                    <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-main-green" />
                                )}
                            </div>
                        </div>

                        {locationError && (
                            <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                {locationError}. Название можно ввести вручную.
                            </div>
                        )}

                        {point && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-main-gray">
                                <MapPin className="size-3.5" />
                                {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={handleClose} className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                                Отмена
                            </button>

                            <button type="button" onClick={handleApply} disabled={!point || !name.trim() || isResolving} className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-5 text-sm font-semibold text-white transition-colors hover:bg-hover-green disabled:cursor-not-allowed disabled:opacity-50">
                                {isResolving ? <LoaderCircle className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                                Прикрепить место
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default PostLocationPicker