"use client"

import { enableGeoChatTestAccess } from "@/actions/enableGeoChatTestAccess"
import { syncPreciseLocation } from "@/actions/syncPreciseLocation"
import NearbyGeoChats from "@/components/GeoChat/NearbyGeoChats"
import { KeyRound, LocateFixed, MapPin, RefreshCw, Settings, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type Status = "checking" | "prompt" | "requesting" | "ready" | "denied" | "unsupported" | "error"

type LocationInfo = {
    accuracy: number
}

type SyncedLocation = {
    latitude: number
    longitude: number
    syncedAt: number
}

type Props = {
    initialTestAccess?: boolean
}

const MIN_SYNC_INTERVAL_MS = 15000
const MIN_DISTANCE_M = 100
const FORCE_SYNC_INTERVAL_MS = 120000

function getDistanceMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
    const earthRadiusM = 6371000
    const toRadians = (value: number) => value * Math.PI / 180

    const latitudeDelta = toRadians(latitude2 - latitude1)
    const longitudeDelta = toRadians(longitude2 - longitude1)

    const a =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(toRadians(latitude1)) *
        Math.cos(toRadians(latitude2)) *
        Math.sin(longitudeDelta / 2) *
        Math.sin(longitudeDelta / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadiusM * c
}

function GeoChatLocationGate({ initialTestAccess = false }: Props) {
    const [status, setStatus] = useState<Status>("checking")
    const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
    const [locationVersion, setLocationVersion] = useState(0)
    const [error, setError] = useState("")

    const [testAccess, setTestAccess] = useState(initialTestAccess)
    const [testPassword, setTestPassword] = useState("")
    const [testError, setTestError] = useState("")
    const [isTestPending, setIsTestPending] = useState(false)

    const lastSyncedLocationRef = useRef<SyncedLocation | null>(null)
    const syncLockRef = useRef(false)

    const savePosition = useCallback(async (position: GeolocationPosition, force: boolean) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const accuracy = position.coords.accuracy
        const now = Date.now()

        setLocationInfo({
            accuracy
        })

        const previous = lastSyncedLocationRef.current

        if (!force && previous) {
            const elapsed = now - previous.syncedAt
            const distance = getDistanceMeters(previous.latitude, previous.longitude, latitude, longitude)

            if (elapsed < MIN_SYNC_INTERVAL_MS) {
                return true
            }

            if (distance < MIN_DISTANCE_M && elapsed < FORCE_SYNC_INTERVAL_MS) {
                return true
            }
        }

        if (syncLockRef.current) {
            return true
        }

        syncLockRef.current = true

        try {
            const result = await syncPreciseLocation({
                latitude,
                longitude,
                accuracy: Number.isFinite(accuracy) ? accuracy : null
            })

            if (result.success === false) {
                setError(result.error)
                return false
            }

            lastSyncedLocationRef.current = {
                latitude,
                longitude,
                syncedAt: now
            }

            setLocationVersion((current) => current + 1)

            if (process.env.NODE_ENV === "development") {
                console.log("GEOCHAT LOCATION UPDATED:", latitude, longitude, accuracy)
            }

            return true
        } catch (error) {
            console.error("GEOCHAT LOCATION SYNC ERROR:", error)
            setError("Не удалось сохранить местоположение")
            return false
        } finally {
            syncLockRef.current = false
        }
    }, [])

    const requestLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus("unsupported")
            return
        }

        setStatus("requesting")
        setError("")

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const success = await savePosition(position, true)

                if (!success) {
                    setStatus("error")
                    return
                }

                setStatus("ready")
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
                maximumAge: 0
            }
        )
    }, [savePosition])

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

    const handleTestAccess = async () => {
        if (isTestPending || !testPassword.trim()) return

        setIsTestPending(true)
        setTestError("")

        try {
            const result = await enableGeoChatTestAccess(testPassword)

            if (result.success === false) {
                setTestError(result.error)
                return
            }

            setTestAccess(true)
            setTestPassword("")
        } catch (error) {
            console.error("GEO CHAT TEST ACCESS ERROR:", error)
            setTestError("Не удалось включить тестовый доступ")
        } finally {
            setIsTestPending(false)
        }
    }

    useEffect(() => {
        if (testAccess) return

        void checkPermission()
    }, [checkPermission, testAccess])

    useEffect(() => {
        if (testAccess) return
        if (status !== "ready") return
        if (!navigator.geolocation) return

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                void savePosition(position, false)
            },
            (positionError) => {
                if (positionError.code === positionError.PERMISSION_DENIED) {
                    setStatus("denied")
                    return
                }

                console.error("GEOCHAT LOCATION WATCH ERROR:", positionError)
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 5000
            }
        )

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [savePosition, status, testAccess])

    const testAccessForm = (
        <div className="mt-6 w-full max-w-[420] rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-left">
            <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-main-green" />
                <div className="text-sm font-semibold text-gray-900">Тестовый доступ</div>
            </div>

            <div className="mt-1 text-xs leading-5 text-main-gray">Для тестирования геочатов без доступа к геолокации.</div>

            <div className="mt-3 flex gap-2">
                <input type="password" value={testPassword} onChange={(event) => { setTestPassword(event.target.value); setTestError("") }} onKeyDown={(event) => { if (event.key === "Enter") void handleTestAccess() }} placeholder="Введите пароль" className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-main-green" />

                <button type="button" onClick={() => void handleTestAccess()} disabled={isTestPending || !testPassword.trim()} className="h-10 shrink-0 cursor-pointer rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-40">
                    {isTestPending ? "..." : "Открыть"}
                </button>
            </div>

            {testError && (
                <div className="mt-2 text-xs text-red-600">
                    {testError}
                </div>
            )}
        </div>
    )

    if (testAccess) {
        return <NearbyGeoChats accuracy={null} />
    }

    if (status === "checking") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="flex w-full max-w-[460] flex-col items-center text-center">
                    <RefreshCw className="size-6 animate-spin text-main-green" />
                    <div className="mt-3 text-sm text-main-gray">Проверяем доступ к местоположению...</div>
                    {testAccessForm}
                </div>
            </div>
        )
    }

    if (status === "requesting") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="flex w-full max-w-[460] flex-col items-center text-center">
                    <LocateFixed className="size-8 animate-pulse text-main-green" />
                    <div className="mt-4 text-base font-semibold text-gray-900">Определяем ваше местоположение</div>
                    <div className="mt-2 text-sm leading-6 text-main-gray">Получаем актуальное местоположение устройства.</div>
                    {testAccessForm}
                </div>
            </div>
        )
    }

    if (status === "prompt") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5 py-10">
                <div className="flex w-full max-w-[460] flex-col items-center text-center">
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

                    {testAccessForm}
                </div>
            </div>
        )
    }

    if (status === "denied") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 py-10">
                <div className="flex w-full max-w-[460] flex-col items-center text-center">
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

                    {testAccessForm}
                </div>
            </div>
        )
    }

    if (status === "unsupported") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 py-10 text-center">
                <div className="flex w-full max-w-[460] flex-col items-center">
                    <div className="text-base font-semibold text-gray-900">Геолокация недоступна</div>
                    <div className="mt-2 text-sm leading-6 text-main-gray">Этот браузер или устройство не поддерживает определение местоположения.</div>
                    {testAccessForm}
                </div>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 py-10">
                <div className="flex w-full max-w-[460] flex-col items-center text-center">
                    <TriangleAlert className="size-8 text-red-500" />
                    <div className="mt-4 text-base font-semibold text-gray-900">Не удалось определить местоположение</div>
                    <div className="mt-2 text-sm leading-6 text-main-gray">{error || "Попробуйте ещё раз"}</div>

                    <button type="button" onClick={() => void requestLocation()} className="mt-5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 px-5 text-sm font-medium text-main-green transition-colors hover:bg-green-50">
                        <RefreshCw className="size-4" />
                        <span>Попробовать снова</span>
                    </button>

                    {testAccessForm}
                </div>
            </div>
        )
    }

    const accuracy = locationInfo?.accuracy ?? null

    return <NearbyGeoChats key={locationVersion} accuracy={accuracy} />
}

export default GeoChatLocationGate