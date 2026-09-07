"use client"

import { syncGeoChatLocationAndAccess } from "@/actions/syncGeoChatLocationAndAccess"
import { useCallback, useEffect, useRef, useState } from "react"

export type GeoChatAccessStatus = "checking" | "active" | "outside" | "denied" | "unsupported" | "error"

type SyncedLocation = {
    latitude: number
    longitude: number
    syncedAt: number
}

const MIN_SYNC_INTERVAL_MS = 10000
const MIN_DISTANCE_M = 25
const FORCE_SYNC_INTERVAL_MS = 30000

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

function useGeoChatLiveAccess(chatId: string) {
    const [status, setStatus] = useState<GeoChatAccessStatus>("checking")
    const [error, setError] = useState("")
    const [accuracy, setAccuracy] = useState<number | null>(null)

    const lastSyncedLocationRef = useRef<SyncedLocation | null>(null)
    const syncLockRef = useRef(false)

    const savePosition = useCallback(async (position: GeolocationPosition, force: boolean) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const positionAccuracy = position.coords.accuracy
        const now = Date.now()

        setAccuracy(Number.isFinite(positionAccuracy) ? positionAccuracy : null)

        const previous = lastSyncedLocationRef.current

        if (!force && previous) {
            const elapsed = now - previous.syncedAt
            const distance = getDistanceMeters(previous.latitude, previous.longitude, latitude, longitude)

            if (elapsed < MIN_SYNC_INTERVAL_MS) {
                return
            }

            if (distance < MIN_DISTANCE_M && elapsed < FORCE_SYNC_INTERVAL_MS) {
                return
            }
        }

        if (syncLockRef.current) return

        syncLockRef.current = true

        try {
            const result = await syncGeoChatLocationAndAccess({
                chatId,
                latitude,
                longitude,
                accuracy: Number.isFinite(positionAccuracy) ? positionAccuracy : null
            })

            if (result.success === false) {
                setError(result.error)
                setStatus("error")
                return
            }

            lastSyncedLocationRef.current = {
                latitude,
                longitude,
                syncedAt: now
            }

            setStatus(result.canAccess ? "active" : "outside")
            setError("")
        } catch (error) {
            console.error("GEO CHAT LIVE LOCATION ERROR:", error)
            setError("Не удалось обновить местоположение")
            setStatus("error")
        } finally {
            syncLockRef.current = false
        }
    }, [chatId])

    useEffect(() => {
        let cancelled = false
        let watchId: number | null = null

        const handleLocationError = (positionError: GeolocationPositionError) => {
            if (cancelled) return

            if (positionError.code === positionError.PERMISSION_DENIED) {
                setStatus("denied")
                setError("")
                return
            }

            if (positionError.code === positionError.TIMEOUT) {
                setStatus("error")
                setError("Не удалось определить местоположение вовремя")
                return
            }

            setStatus("error")
            setError("Не удалось определить текущее местоположение")
        }

        const start = () => {
            setStatus("checking")
            setError("")

            if (!navigator.geolocation) {
                setStatus("unsupported")
                return
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    if (cancelled) return

                    await savePosition(position, true)

                    if (cancelled) return

                    watchId = navigator.geolocation.watchPosition(
                        (nextPosition) => {
                            void savePosition(nextPosition, false)
                        },
                        handleLocationError,
                        {
                            enableHighAccuracy: true,
                            timeout: 20000,
                            maximumAge: 5000
                        }
                    )
                },
                handleLocationError,
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                }
            )
        }

        start()

        return () => {
            cancelled = true

            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [savePosition])

    return {
        status,
        error,
        accuracy,
        canSend: status === "active"
    }
}

export default useGeoChatLiveAccess