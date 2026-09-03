import "server-only"

type IpInfoResponse = {
    city?: string
    region?: string
    country?: string
    loc?: string
    error?: {
        title?: string
        message?: string
    }
}

export type IpInfoLocation = {
    city: string
    region: string
    countryCode: string
    latitude: number
    longitude: number
}

export async function getIpInfoLocation(ip: string): Promise<IpInfoLocation | null> {
    const token = process.env.IPINFO_TOKEN

    if (!token) {
        console.error("IPINFO_TOKEN is not configured")
        return null
    }

    try {
        const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`, {
            cache: "no-store",
            headers: {
                Accept: "application/json"
            }
        })

        if (!response.ok) {
            console.error("IPINFO HTTP ERROR:", response.status)
            return null
        }

        const data = await response.json() as IpInfoResponse

        if (data.error) {
            console.error("IPINFO API ERROR:", data.error.title, data.error.message)
            return null
        }

        if (!data.city || !data.region || !data.country || !data.loc) {
            console.error("IPINFO GEO DATA INCOMPLETE")
            return null
        }

        const [latitudeString, longitudeString] = data.loc.split(",")

        const latitude = Number(latitudeString)
        const longitude = Number(longitudeString)

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            console.error("IPINFO COORDINATES INVALID:", data.loc)
            return null
        }

        return {
            city: data.city,
            region: data.region,
            countryCode: data.country.toUpperCase(),
            latitude,
            longitude
        }
    } catch (error) {
        console.error("IPINFO REQUEST ERROR:", error)
        return null
    }
}