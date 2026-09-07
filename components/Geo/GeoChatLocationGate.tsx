"use client"

import { syncPreciseLocation } from "@/actions/syncPreciseLocation"
import GeoChatAdminAccess from "@/components/GeoChat/GeoChatAdminAccess"
import NearbyGeoChats from "@/components/GeoChat/NearbyGeoChats"
import { LocateFixed, MapPin, RefreshCw, Settings, Shield, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type Props = {
    initialAdminMode: boolean
}

type Status = "checking" | "prompt" | "requesting" | "ready" | "denied" | "unsupported" | "error"

type LocationInfo = {
    accuracy: number
}

type SyncedLocation = {
    latitude: number
    longitude: number
    syncedAt: number
}

const MIN_DISTANCE_M = 50
const MIN_SYNC_INTERVAL_MS = 5000
const MAX_SYNC_INTERVAL_MS = 60000

function getDistanceMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
    const earthRadiusM = 6371000
    const toRadians = (value: number) => value * Math.PI / 180

    const latitudeDelta = toRadians(latitude2 - latitude1)
    const longitudeDelta = toRadians(longitude2 - longitude1)

    const a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) + Math.cos(toRadians(latitude1)) * Math.cos(toRadians(latitude2)) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadiusM * c
}

function GeoChatLocationGate({ initialAdminMode }: Props) {
    const [status, setStatus] = useState<Status>("checking")
    const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
    const [locationVersion, setLocationVersion] = useState(0)
    const [adminMode, setAdminMode] = useState(initialAdminMode)
    const [error, setError] = useState("")

    const watchIdRef = useRef<number | null>(null)
    const lastSyncedLocationRef = useRef<SyncedLocation | null>(null)
    const syncLockRef = useRef(false)
    const hasLocationRef = useRef(false)

    const syncPosition = useCallback(async (position: GeolocationPosition, force = false) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const accuracy = position.coords.accuracy
        const now = Date.now()

        setLocationInfo({ accuracy })

        const previous = lastSyncedLocationRef.current

        if (!force && previous) {
            const elapsed = now - previous.syncedAt
            const distance = getDistanceMeters(previous.latitude, previous.longitude, latitude, longitude)

            if (elapsed < MIN_SYNC_INTERVAL_MS) return
            if (distance < MIN_DISTANCE_M && elapsed < MAX_SYNC_INTERVAL_MS) return
        }

        if (syncLockRef.current) return

        syncLockRef.current = true

        try {
            const result = await syncPreciseLocation({
                latitude,
                longitude,
                accuracy: Number.isFinite(accuracy) ? accuracy : null
            })

            if (result.success === false) {
                if (!hasLocationRef.current) {
                    setError(result.error)
                    setStatus("error")
                }

                return
            }

            lastSyncedLocationRef.current = {
                latitude,
                longitude,
                syncedAt: now
            }

            hasLocationRef.current = true
            setStatus("ready")
            setLocationVersion((current) => current + 1)
        } catch (error) {
            console.error("GEOCHAT LOCATION SYNC ERROR:", error)

            if (!hasLocationRef.current) {
                setError("Не удалось сохранить местоположение")
                setStatus("error")
            }
        } finally {
            syncLockRef.current = false
        }
    }, [])

    const handleLocationError = useCallback((positionError: GeolocationPositionError) => {
        if (hasLocationRef.current) return

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
    }, [])

    const startLocationWatch = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus("unsupported")
            return
        }

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
        }

        if (!hasLocationRef.current) {
            setStatus("requesting")
        }

        setError("")

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                void syncPosition(position)
            },
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        )
    }, [handleLocationError, syncPosition])

    const refreshLocation = useCallback(() => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            (position) => {
                void syncPosition(position, true)
            },
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        )
    }, [handleLocationError, syncPosition])

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
                startLocationWatch()
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
    }, [startLocationWatch])

    useEffect(() => {
        if (adminMode) {
            if (watchIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
            }

            return
        }

        void checkPermission()

        return () => {
            if (watchIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
            }
        }
    }, [adminMode, checkPermission])

    useEffect(() => {
        if (adminMode) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && hasLocationRef.current) {
                refreshLocation()
            }
        }

        const handleFocus = () => {
            if (hasLocationRef.current) {
                refreshLocation()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("focus", handleFocus)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("focus", handleFocus)
        }
    }, [adminMode, refreshLocation])

    if (adminMode) {
        return <NearbyGeoChats accuracy={locationInfo?.accuracy ?? null} locationVersion={locationVersion} initialAdminMode onAdminModeChange={setAdminMode} />
    }

    if (status === "checking") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white">
                <RefreshCw className="size-6 animate-spin text-main-green" />
            </div>
        )
    }

    if (status === "requesting") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="text-center">
                    <LocateFixed className="mx-auto size-8 animate-pulse text-main-green" />
                    <div className="mt-4 font-semibold text-gray-900">Определяем ваше местоположение</div>
                    <div className="mt-2 text-sm text-main-gray">Подтвердите доступ к геолокации в браузере.</div>
                </div>
            </div>
        )
    }

    if (status === "prompt") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="max-w-[460] text-center">
                    <MapPin className="mx-auto size-8 text-main-green" />
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Найдём геочаты рядом</h2>
                    <p className="mt-2 text-sm leading-6 text-main-gray">Разрешите доступ к местоположению, чтобы увидеть доступные геочаты.</p>

                    <button type="button" onClick={startLocationWatch} className="mt-5 h-11 cursor-pointer rounded-xl bg-main-green px-5 text-sm font-medium text-white hover:bg-hover-green">
                        Разрешить местоположение
                    </button>
                </div>
            </div>
        )
    }

    if (status === "denied") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 py-10">
                <div className="flex max-w-[500] flex-col items-center text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Settings className="size-7" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-900">Доступ к геолокации запрещён</h2>

                    <p className="mt-2 text-sm leading-6 text-main-gray">Чтобы пользоваться обычными геочатами, разрешите ВСети доступ к местоположению.</p>

                    <button type="button" onClick={() => void checkPermission()} className="mt-5 flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-green-200 px-5 text-sm font-medium text-main-green hover:bg-green-50">
                        <RefreshCw className="size-4" />
                        <span>Проверить снова</span>
                    </button>

                    <div className="my-6 h-px w-full bg-gray-100" />

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Shield className="size-4 text-main-green" />
                        <span>Режим администратора</span>
                    </div>

                    <div className="mt-2 text-xs leading-5 text-main-gray">Для просмотра всех геочатов местоположение не требуется.</div>

                    <div className="mt-4">
                        <GeoChatAdminAccess adminMode={false} onChanged={setAdminMode} />
                    </div>
                </div>
            </div>
        )
    }

    if (status === "unsupported") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 text-center">
                <div>
                    <TriangleAlert className="mx-auto size-8 text-red-500" />
                    <div className="mt-4 font-semibold text-gray-900">Геолокация недоступна</div>
                </div>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 text-center">
                <div>
                    <TriangleAlert className="mx-auto size-8 text-red-500" />
                    <div className="mt-4 font-semibold text-gray-900">Не удалось определить местоположение</div>
                    <div className="mt-2 text-sm text-main-gray">{error}</div>
                </div>
            </div>
        )
    }

    return <NearbyGeoChats accuracy={locationInfo?.accuracy ?? null} locationVersion={locationVersion} initialAdminMode={false} onAdminModeChange={setAdminMode} />
}

export default GeoChatLocationGate