"use client"

import { syncPreciseLocation } from "@/actions/syncPreciseLocation"
import { useCallback, useEffect, useRef, useState } from "react"

export type GeoChatLocationStatus = "checking" | "prompt" | "requesting" | "ready" | "denied" | "unsupported" | "error"

type SyncedLocation = {
    latitude: number
    longitude: number
    syncedAt: number
}

type QueuedPosition = {
    position: GeolocationPosition
    force: boolean
}

type Options = {
    enabled: boolean
}

const MIN_DISTANCE_M = 50
const MAX_SYNC_INTERVAL_MS = 30000
const POLL_INTERVAL_MS = 10000
const POSITION_TIMEOUT_MS = 8000

function getDistanceMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
    const earthRadiusM = 6371000
    const toRadians = (value: number) => value * Math.PI / 180
    const latitudeDelta = toRadians(latitude2 - latitude1)
    const longitudeDelta = toRadians(longitude2 - longitude1)
    const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(latitude1)) * Math.cos(toRadians(latitude2)) * Math.sin(longitudeDelta / 2) ** 2
    return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function requestFreshPosition() {
    return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: POSITION_TIMEOUT_MS,
            maximumAge: 0
        })
    })
}

function useGeoChatLocationTracking({ enabled }: Options) {
    const [status, setStatus] = useState<GeoChatLocationStatus>("checking")
    const [accuracy, setAccuracy] = useState<number | null>(null)
    const [locationVersion, setLocationVersion] = useState(0)
    const [error, setError] = useState("")

    const watchIdRef = useRef<number | null>(null)
    const lastSyncedRef = useRef<SyncedLocation | null>(null)
    const syncLockRef = useRef(false)
    const queuedPositionRef = useRef<QueuedPosition | null>(null)
    const hasLocationRef = useRef(false)
    const activeRef = useRef(true)

    const handleLocationError = useCallback((positionError: GeolocationPositionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
            hasLocationRef.current = false
            setStatus("denied")
            return
        }

        if (hasLocationRef.current) return

        setError(positionError.code === positionError.TIMEOUT ? "Не удалось определить местоположение вовремя" : "Не удалось определить местоположение")
        setStatus("error")
    }, [])

    const syncPosition = useCallback(async (position: GeolocationPosition, force = false) => {
        if (!activeRef.current) return

        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const nextAccuracy = position.coords.accuracy
        const now = Date.now()

        setAccuracy(Number.isFinite(nextAccuracy) ? nextAccuracy : null)

        const previous = lastSyncedRef.current

        if (!force && previous) {
            const elapsed = now - previous.syncedAt
            const distance = getDistanceMeters(previous.latitude, previous.longitude, latitude, longitude)

            if (distance < MIN_DISTANCE_M && elapsed < MAX_SYNC_INTERVAL_MS) return
        }

        if (syncLockRef.current) {
            queuedPositionRef.current = {
                position,
                force: queuedPositionRef.current?.force === true || force
            }
            return
        }

        syncLockRef.current = true

        try {
            const result = await syncPreciseLocation({
                latitude,
                longitude,
                accuracy: Number.isFinite(nextAccuracy) ? nextAccuracy : null
            })

            if (!activeRef.current) return

            if (result.success === false) {
                if (!hasLocationRef.current) {
                    setError(result.error)
                    setStatus("error")
                }
                return
            }

            lastSyncedRef.current = { latitude, longitude, syncedAt: Date.now() }
            hasLocationRef.current = true
            setError("")
            setStatus("ready")
            setLocationVersion((current) => current + 1)
        } catch (syncError) {
            console.error("GEOCHAT LOCATION SYNC ERROR:", syncError)

            if (!hasLocationRef.current) {
                setError("Не удалось сохранить местоположение")
                setStatus("error")
            }
        } finally {
            syncLockRef.current = false

            const queued = queuedPositionRef.current
            queuedPositionRef.current = null

            if (queued && activeRef.current) {
                window.setTimeout(() => void syncPosition(queued.position, queued.force), 0)
            }
        }
    }, [])

    const refreshLocation = useCallback(async (force = false) => {
        if (!enabled || !navigator.geolocation) return

        try {
            await syncPosition(await requestFreshPosition(), force)
        } catch (positionError) {
            handleLocationError(positionError as GeolocationPositionError)
        }
    }, [enabled, handleLocationError, syncPosition])

    const stopWatch = useCallback(() => {
        if (watchIdRef.current === null || !navigator.geolocation) return
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
    }, [])

    const startWatch = useCallback(() => {
        if (!enabled || !navigator.geolocation) return

        stopWatch()

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => void syncPosition(position),
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        )
    }, [enabled, handleLocationError, stopWatch, syncPosition])

    const startTracking = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus("unsupported")
            return
        }

        setError("")
        if (!hasLocationRef.current) setStatus("requesting")

        try {
            await syncPosition(await requestFreshPosition(), true)
            startWatch()
        } catch (positionError) {
            handleLocationError(positionError as GeolocationPositionError)
        }
    }, [handleLocationError, startWatch, syncPosition])

    const checkPermission = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus("unsupported")
            return
        }

        if (!navigator.permissions) {
            await startTracking()
            return
        }

        try {
            const permission = await navigator.permissions.query({ name: "geolocation" })

            if (permission.state === "denied") {
                setStatus("denied")
                return
            }

            if (permission.state === "prompt") {
                setStatus("prompt")
                return
            }

            await startTracking()
        } catch {
            await startTracking()
        }
    }, [startTracking])

    useEffect(() => {
        activeRef.current = true
        return () => {
            activeRef.current = false
        }
    }, [])

    useEffect(() => {
        if (!enabled) {
            stopWatch()
            return
        }

        void checkPermission()
        return stopWatch
    }, [checkPermission, enabled, stopWatch])

    useEffect(() => {
        if (!enabled || status !== "ready") return

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") void refreshLocation(false)
        }, POLL_INTERVAL_MS)

        return () => window.clearInterval(intervalId)
    }, [enabled, refreshLocation, status])

    useEffect(() => {
        if (!enabled) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") void refreshLocation(true)
        }

        const handleFocus = () => void refreshLocation(true)
        const handleOnline = () => void refreshLocation(true)

        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("focus", handleFocus)
        window.addEventListener("online", handleOnline)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("focus", handleFocus)
            window.removeEventListener("online", handleOnline)
        }
    }, [enabled, refreshLocation])

    return {
        status,
        accuracy,
        locationVersion,
        error,
        startTracking,
        retry: checkPermission
    }
}

export default useGeoChatLocationTracking
