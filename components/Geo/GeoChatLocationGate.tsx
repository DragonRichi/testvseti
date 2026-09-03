"use client"

import { syncPreciseLocation } from "@/actions/syncPreciseLocation"
import { CheckCircle2, LocateFixed, MapPin, RefreshCw, Settings, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type Status = "checking" | "prompt" | "requesting" | "ready" | "denied" | "unsupported" | "error"

type LocationInfo = {
    accuracy: number
}

function GeoChatLocationGate() {
    const [status, setStatus] = useState<Status>("checking")
    const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
    const [error, setError] = useState<string>("")

    const requestLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus("unsupported")
            return
        }

        setStatus("requesting")
        setError("")

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude
                const accuracy = position.coords.accuracy

                setLocationInfo({
                    accuracy
                })

                try {
                    const result = await syncPreciseLocation({
                        latitude,
                        longitude,
                        accuracy: Number.isFinite(accuracy) ? accuracy : null
                    })

                    if (result.success === false) {
                        setError(result.error)
                        setStatus("error")
                        return
                    }

                    setStatus("ready")
                } catch (error) {
                    console.error("GEOCHAT LOCATION SYNC ERROR:", error)
                    setError("Не удалось сохранить местоположение")
                    setStatus("error")
                }
            },
            (positionError) => {
                if (positionError.code === positionError.PERMISSION_DENIED) {
                    setStatus("denied")
                    return
                }

                if (positionError.code === positionError.TIMEOUT) {
                    setError("Не удалось определить местоположение вовремя")
                    setStatus("error")
                    return
                }

                setError("Не удалось определить местоположение")
                setStatus("error")
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 15000
            }
        )
    }, [])

    const checkPermission = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus("unsupported")
            return
        }

        if (!navigator.permissions) {
            setStatus("prompt")
            return
        }

        try {
            const permission = await navigator.permissions.query({
                name: "geolocation"
            })

            if (permission.state === "granted") {
                await requestLocation()
                return
            }

            if (permission.state === "denied") {
                setStatus("denied")
                return
            }

            setStatus("prompt")
        } catch {
            setStatus("prompt")
        }
    }, [requestLocation])

    useEffect(() => {
        void checkPermission()
    }, [checkPermission])

    if (status === "checking") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white">
                <div className="flex flex-col items-center text-center">
                    <RefreshCw className="size-6 animate-spin text-main-green" />
                    <div className="mt-3 text-sm text-main-gray">Проверяем доступ к местоположению...</div>
                </div>
            </div>
        )
    }

    if (status === "requesting") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="flex max-w-[420] flex-col items-center text-center">
                    <LocateFixed className="size-8 animate-pulse text-main-green" />
                    <div className="mt-4 text-base font-semibold text-gray-900">Определяем ваше местоположение</div>
                    <div className="mt-2 text-sm leading-6 text-main-gray">Подтвердите доступ к геолокации в системном окне браузера.</div>
                </div>
            </div>
        )
    }

    if (status === "prompt") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5 py-10">
                <div className="flex max-w-[460] flex-col items-center text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <MapPin className="size-7" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-900">Найдём геочаты рядом</h2>

                    <p className="mt-2 text-sm leading-6 text-main-gray">Геочаты показываются в зависимости от вашего текущего местоположения. Можно использовать как точную, так и примерную геопозицию.</p>

                    <button type="button" onClick={() => void requestLocation()} className="mt-6 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-5 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                        <LocateFixed className="size-4" />
                        <span>Разрешить местоположение</span>
                    </button>

                    <div className="mt-4 text-xs leading-5 text-main-gray">Местоположение используется для определения доступных геочатов рядом с вами.</div>
                </div>
            </div>
        )
    }

    if (status === "denied") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 py-10">
                <div className="flex max-w-[460] flex-col items-center text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Settings className="size-7" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-900">Доступ к геолокации запрещён</h2>

                    <p className="mt-2 text-sm leading-6 text-main-gray">Чтобы пользоваться геочатами, разрешите ВСети доступ к местоположению в настройках браузера или телефона.</p>

                    <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">После изменения разрешения вернитесь сюда и нажмите «Проверить снова».</div>

                    <button type="button" onClick={() => void checkPermission()} className="mt-5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 text-sm font-medium text-main-green transition-colors hover:bg-green-50">
                        <RefreshCw className="size-4" />
                        <span>Проверить снова</span>
                    </button>
                </div>
            </div>
        )
    }

    if (status === "unsupported") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 text-center">
                <div className="max-w-[420]">
                    <div className="text-base font-semibold text-gray-900">Геолокация недоступна</div>
                    <div className="mt-2 text-sm leading-6 text-main-gray">Этот браузер или устройство не поддерживает определение местоположения.</div>
                </div>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 py-10">
                <div className="flex max-w-[420] flex-col items-center text-center">
                    <TriangleAlert className="size-8 text-red-500" />
                    <div className="mt-4 text-base font-semibold text-gray-900">Не удалось определить местоположение</div>
                    <div className="mt-2 text-sm leading-6 text-main-gray">{error || "Попробуйте ещё раз"}</div>

                    <button type="button" onClick={() => void requestLocation()} className="mt-5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 px-5 text-sm font-medium text-main-green transition-colors hover:bg-green-50">
                        <RefreshCw className="size-4" />
                        <span>Попробовать снова</span>
                    </button>
                </div>
            </div>
        )
    }

    const accuracy = locationInfo?.accuracy ?? null
    const isApproximate = accuracy !== null && accuracy > 1000

    return (
        <div className="rounded-2xl border border-green-100 bg-white">
            <div className="flex min-h-[420] flex-col items-center justify-center px-5 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-50 text-main-green">
                    <CheckCircle2 className="size-8" />
                </div>

                <h2 className="mt-5 text-xl font-bold text-gray-900">Местоположение определено</h2>

                <p className="mt-2 max-w-[460] text-sm leading-6 text-main-gray">Всё готово. Здесь появятся геочаты, доступные рядом с вашим текущим местоположением.</p>

                {accuracy !== null && (
                    <div className="mt-4 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-main-green">
                        {isApproximate ? `Примерное местоположение · ±${Math.max(1, Math.round(accuracy / 1000))} км` : `Точность ±${Math.round(accuracy)} м`}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GeoChatLocationGate