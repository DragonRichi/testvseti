import "server-only"

type IpLocation = {
    city: string
    region: string
    countryCode: string
    latitude: number
    longitude: number
}

type IpWhoResponse = {
    success: boolean
    city?: string
    region?: string
    country_code?: string
    latitude?: number
    longitude?: number
    message?: string
}

export async function getIpLocation(ip: string | null): Promise<IpLocation | null> {
    if (!ip && process.env.NODE_ENV !== "development") {
        return null
    }

    const target = ip ? `/${encodeURIComponent(ip)}` : ""

    try {
        const response = await fetch(`https://ipwho.is${target}?fields=success,city,region,country_code,latitude,longitude,message`, {
            cache: "no-store"
        })

        if (!response.ok) {
            console.error("IP GEO HTTP ERROR:", response.status)
            return null
        }

        const data = await response.json() as IpWhoResponse

        if (!data.success || !data.city || !data.country_code || typeof data.latitude !== "number" || typeof data.longitude !== "number") {
            console.error("IP GEO RESPONSE ERROR:", data)
            return null
        }

        return {
            city: data.city,
            region: data.region ?? "",
            countryCode: data.country_code.toUpperCase(),
            latitude: data.latitude,
            longitude: data.longitude
        }
    } catch (error) {
        console.error("IP GEO ERROR:", error)
        return null
    }
}