"use client"

import { syncUserLocation } from "@/actions/syncUserLocation"
import { useEffect } from "react"

function GeoLocationSync() {
    useEffect(() => {
        const key = "vseti-geo-sync"

        if (sessionStorage.getItem(key)) return

        sessionStorage.setItem(key, "1")

        syncUserLocation().then((result) => {
            if (process.env.NODE_ENV === "development") {
                console.log("GEO SYNC:", result)
            }
        })
    }, [])

    return null
}

export default GeoLocationSync