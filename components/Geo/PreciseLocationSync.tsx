"use client"

import { syncPreciseLocation } from "@/actions/syncPreciseLocation"
import { useEffect, useRef } from "react"

type LocationSnapshot = {
    latitude: number
    longitude: number
    syncedAt: number
}

const MIN_SYNC_INTERVAL_MS = 60 * 1000
const MIN_DISTANCE_M = 50

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

function PreciseLocationSync() {
    const lastLocationRef = useRef<LocationSnapshot | null>(null)
    const syncLockRef = useRef(false)

    useEffect(() => {
        if (!navigator.geolocation) return

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                if (syncLockRef.current) return

                const latitude = position.coords.latitude
                const longitude = position.coords.longitude
                const accuracy = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null

                const previous = lastLocationRef.current
                const now = Date.now()

                if (previous) {
                    const elapsed = now - previous.syncedAt
                    const distance = getDistanceMeters(previous.latitude, previous.longitude, latitude, longitude)

                    if (elapsed < MIN_SYNC_INTERVAL_MS && distance < MIN_DISTANCE_M) {
                        return
                    }
                }

                syncLockRef.current = true

                try {
                    const result = await syncPreciseLocation({
                        latitude,
                        longitude,
                        accuracy
                    })

                    if (result.success === false) {
                        console.error("PRECISE GEO SYNC ERROR:", result.error)
                        return
                    }

                    lastLocationRef.current = {
                        latitude,
                        longitude,
                        syncedAt: now
                    }

                    if (process.env.NODE_ENV === "development") {
                        console.log("PRECISE GEO SYNC:", latitude, longitude, accuracy)
                    }
                } catch (error) {
                    console.error("PRECISE GEO SYNC ERROR:", error)
                } finally {
                    syncLockRef.current = false
                }
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    console.log("PRECISE GEO PERMISSION DENIED")
                    return
                }

                console.error("PRECISE GEO POSITION ERROR:", error)
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            }
        )

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [])

    return null
}

export default PreciseLocationSync