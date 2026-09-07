const POST_MEDIA_BUCKET = "post-media"
const PUBLIC_OBJECT_PREFIX = `/storage/v1/object/public/${POST_MEDIA_BUCKET}/`

type OwnedPostMedia = {
    urls: string[]
    paths: string[]
}

export function getOwnedPostMediaPath(url: string, userId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const normalizedUrl = url.trim()

    if (!supabaseUrl || !normalizedUrl || !userId) return null

    try {
        const parsedUrl = new URL(normalizedUrl)
        const parsedSupabaseUrl = new URL(supabaseUrl)

        if (parsedUrl.origin !== parsedSupabaseUrl.origin) return null
        if (!parsedUrl.pathname.startsWith(PUBLIC_OBJECT_PREFIX)) return null

        const encodedPath = parsedUrl.pathname.slice(PUBLIC_OBJECT_PREFIX.length)
        const path = decodeURIComponent(encodedPath)
        const userPrefix = `${userId}/`

        if (!path.startsWith(userPrefix)) return null

        const fileName = path.slice(userPrefix.length)

        if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName === "." || fileName === "..") return null

        return path
    } catch {
        return null
    }
}

export function normalizeOwnedPostMediaUrls(mediaUrls: string[], userId: string): OwnedPostMedia | null {
    const urls = [...new Set(mediaUrls.map((url) => url.trim()).filter((url) => url.length > 0))]
    const paths: string[] = []

    for (const url of urls) {
        const path = getOwnedPostMediaPath(url, userId)

        if (!path) return null

        paths.push(path)
    }

    return {
        urls,
        paths
    }
}