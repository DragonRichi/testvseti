"use client"

import { syncUserLocation } from "@/actions/syncUserLocation"
import { useEffect } from "react"

type Props = {
    userId: string
}

function GeoLocationSync({ userId }: Props) {
    useEffect(() => {
        const key = `vseti-geo-sync:${userId}`

        if (sessionStorage.getItem(key)) return

        sessionStorage.setItem(key, "1")

        syncUserLocation().then((result) => {
            if (result.success === false) {
                sessionStorage.removeItem(key)
            }

            if (process.env.NODE_ENV === "development") {
                console.log("GEO SYNC:", result)
            }
        })
    }, [userId])

    return null
}

export default GeoLocationSync