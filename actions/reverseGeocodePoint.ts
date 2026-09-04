"use server"

type Props = {
    latitude: number
    longitude: number
}

type NominatimAddress = {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    region?: string
    country?: string
    country_code?: string
}

type NominatimResponse = {
    name?: string
    display_name?: string
    address?: NominatimAddress
}

type Result =
    | {
        success: true
        name: string
        city: string | null
        region: string | null
        countryCode: string | null
    }
    | {
        success: false
        error: string
    }

export async function reverseGeocodePoint({ latitude, longitude }: Props): Promise<Result> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return {
            success: false,
            error: "Некорректная широта"
        }
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return {
            success: false,
            error: "Некорректная долгота"
        }
    }

    try {
        const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
            addressdetails: "1",
            zoom: "18",
            "accept-language": "en"
        })

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "User-Agent": "vseti.by/1.0"
            }
        })

        if (!response.ok) {
            console.error("REVERSE GEOCODE HTTP ERROR:", response.status)

            return {
                success: false,
                error: "Не удалось определить место"
            }
        }

        const data = await response.json() as NominatimResponse
        const address = data.address ?? {}

        const city = address.city ?? address.town ?? address.village ?? address.municipality ?? null
        const region = address.state ?? address.region ?? address.county ?? null
        const countryCode = address.country_code?.toUpperCase() ?? null

        const name = data.name?.trim() || city || data.display_name?.split(",")[0]?.trim() || ""

        if (!name) {
            return {
                success: false,
                error: "Не удалось определить название места"
            }
        }

        return {
            success: true,
            name,
            city,
            region,
            countryCode
        }
    } catch (error) {
        console.error("REVERSE GEOCODE ERROR:", error)

        return {
            success: false,
            error: "Не удалось определить место"
        }
    }
}