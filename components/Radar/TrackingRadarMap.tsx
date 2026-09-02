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
        <div className="h-[420] w-full overflow-hidden rounded-2xl border border-gray-200 sm:h-[500]">
            <MapContainer center={center} zoom={6} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <MapClickHandler onPointChange={onPointChange} />

                {point && (
                    <>
                        <Circle center={[point.latitude, point.longitude]} radius={radiusM} pathOptions={{ fillOpacity: 0.12 }} />

                        <CircleMarker center={[point.latitude, point.longitude]} radius={7} />
                    </>
                )}
            </MapContainer>
        </div>
    )
}

export default TrackingRadarMap