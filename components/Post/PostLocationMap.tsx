"use client"

import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet"

export type PostLocationPoint = {
    latitude: number
    longitude: number
}

type ClickHandlerProps = {
    point: PostLocationPoint | null
    onPointChange: (point: PostLocationPoint) => void
}

function ClickHandler({ point, onPointChange }: ClickHandlerProps) {
    useMapEvents({
        click(event) {
            onPointChange({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng
            })
        }
    })

    if (!point) return null

    return (
        <CircleMarker center={[point.latitude, point.longitude]} radius={8} pathOptions={{ fillOpacity: 1 }} />
    )
}

type Props = {
    point: PostLocationPoint | null
    onPointChange: (point: PostLocationPoint) => void
}

function PostLocationMap({ point, onPointChange }: Props) {
    return (
        <MapContainer center={point ? [point.latitude, point.longitude] : [53.7, 27.95]} zoom={point ? 12 : 6} className="h-[360] w-full rounded-2xl sm:h-[420]">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler point={point} onPointChange={onPointChange} />
        </MapContainer>
    )
}

export default PostLocationMap