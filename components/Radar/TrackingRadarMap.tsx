"use client"

import { Circle, CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet"

export type RadarPoint = {
    latitude: number
    longitude: number
}

type Props = {
    point: RadarPoint | null
    radiusM: number
    onPointChange: (point: RadarPoint) => void
}

type MapClickHandlerProps = {
    onPointChange: (point: RadarPoint) => void
}

function MapClickHandler({ onPointChange }: MapClickHandlerProps) {
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

function TrackingRadarMap({ point, radiusM, onPointChange }: Props) {
    const center: [number, number] = [53.7, 27.95]

    return (
        <div className="relative h-[420] w-full overflow-hidden rounded-2xl border border-gray-200 sm:h-[500]">
            <MapContainer attributionControl={false} center={center} zoom={6} scrollWheelZoom className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <MapClickHandler onPointChange={onPointChange} />

                {point && (
                    <>
                        <Circle center={[point.latitude, point.longitude]} radius={radiusM} pathOptions={{ fillOpacity: 0.12 }} />
                        <CircleMarker center={[point.latitude, point.longitude]} radius={7} />
                    </>
                )}
            </MapContainer>

            <div className="absolute bottom-1 right-1 z-500 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-gray-600">
                © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">OpenStreetMap contributors</a>
            </div>
        </div>
    )
}

export default TrackingRadarMap