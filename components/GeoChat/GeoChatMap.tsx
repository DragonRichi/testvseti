"use client"

import type { GeoChatPoint } from "@/types/geoChat"
import { Circle, CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet"

type Props = {
    point: GeoChatPoint
    radiusM: number
    onPointChange: (point: GeoChatPoint) => void
}

type ClickHandlerProps = {
    onPointChange: (point: GeoChatPoint) => void
}

function ClickHandler({ onPointChange }: ClickHandlerProps) {
    useMapEvents({
        click(event) {
            onPointChange({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng
            })
        }
    })

    return null
}

function GeoChatMap({ point, radiusM, onPointChange }: Props) {
    return (
        <div className="relative h-[360] w-full overflow-hidden rounded-2xl border border-gray-200 sm:h-[440]">
            <MapContainer attributionControl={false} center={[point.latitude, point.longitude]} zoom={12} scrollWheelZoom className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <ClickHandler onPointChange={onPointChange} />

                <Circle center={[point.latitude, point.longitude]} radius={radiusM} pathOptions={{ fillOpacity: 0.12 }} />
                <CircleMarker center={[point.latitude, point.longitude]} radius={7} />
            </MapContainer>

            <div className="absolute bottom-1 right-1 z-500 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-gray-600">
                © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">OpenStreetMap contributors</a>
            </div>
        </div>
    )
}

export default GeoChatMap