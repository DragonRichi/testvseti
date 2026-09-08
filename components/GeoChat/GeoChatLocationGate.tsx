"use client"

import GeoChatLocationState from "@/components/GeoChat/GeoChatLocationState"
import NearbyGeoChats from "@/components/GeoChat/NearbyGeoChats"
import useGeoChatLocationTracking from "@/components/GeoChat/useGeoChatLocationTracking"
import { useState } from "react"

type Props = {
    initialAdminMode: boolean
}

function GeoChatLocationGate({ initialAdminMode }: Props) {
    const [adminMode, setAdminMode] = useState(initialAdminMode)

    const { status, accuracy, locationVersion, error, startTracking, retry } = useGeoChatLocationTracking({
        enabled: !adminMode
    })

    if (adminMode) {
        return <NearbyGeoChats accuracy={accuracy} locationVersion={locationVersion} initialAdminMode onAdminModeChange={setAdminMode} />
    }

    if (status !== "ready") {
        return <GeoChatLocationState status={status} error={error} onStart={() => void startTracking()} onRetry={() => void retry()} onAdminModeChange={setAdminMode} />
    }

    return <NearbyGeoChats accuracy={accuracy} locationVersion={locationVersion} initialAdminMode={false} onAdminModeChange={setAdminMode} />
}

export default GeoChatLocationGate
