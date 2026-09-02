"use server"

type Props = {
    latitude: number
    longitude: number
}

type NominatimResponse = {
    display_name?: string
    address?: {
        city?: string
        town?: string
        village?: string
        municipality?: string
        county?: string
        state?: string
        country?: string
        country_code?: string
    }
}

type Result =
    | {
        success: true
        error: null
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
            lat: latitude.toString(),
            lon: longitude.toString(),
            zoom: "14",
            addressdetails: "1",
            "accept-language": "ru"
        })

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: {
                "User-Agent": "vseti.by/1.0",
                Referer: "https://vseti.by",
                Accept: "application/json"
            },
            cache: "no-store"
        })

        if (!response.ok) {
            console.error("REVERSE GEOCODE HTTP ERROR:", response.status)

            return {
                success: false,
                error: "Не удалось определить место"
            }
        }

        const data = await response.json() as NominatimResponse
        const address = data.address

        if (!address) {
            return {
                success: false,
                error: "Место не найдено"
            }
        }

        const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? null
        const region = address.state ?? address.county ?? null
        const countryCode = address.country_code?.toUpperCase() ?? null

        const nameParts: string[] = []

        if (city) {
            nameParts.push(city)
        }

        if (region && region !== city) {
            nameParts.push(region)
        }

        const name = nameParts.length > 0 ? nameParts.join(", ") : data.display_name ?? ""

        if (!name) {
            return {
                success: false,
                error: "Не удалось определить название места"
            }
        }

        return {
            success: true,
            error: null,
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