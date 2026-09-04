import GeoFeedList from "@/components/Feed/GeoFeedList"
import { getGeoFeed } from "@/lib/feed/getGeoFeed"
import { getGeoFeedItems } from "@/lib/feed/getGeoFeedItems"
import type { Profile } from "@/types/social"

type Props = {
    currentProfile: Profile
}

async function GeoFeed({ currentProfile }: Props) {
    const result = await getGeoFeed()

    if (result.success === false) {
        return (
            <div className="rounded-2xl border border-red-100 bg-white p-5 text-sm text-red-500">
                {result.error}
            </div>
        )
    }

    const { posts, nextCursor } = result

    if (posts.length === 0) {
        return (
            <div className="flex min-h-[300] items-center justify-center rounded-2xl border border-green-100 bg-white px-5 text-center text-sm text-main-gray">
                В ленте пока нет публикаций
            </div>
        )
    }

    const hydrated = await getGeoFeedItems(posts, currentProfile.id)

    return (
        <GeoFeedList
            currentProfile={currentProfile}
            initialItems={hydrated.items}
            initialLikedCommentIds={hydrated.likedCommentIds}
            initialNextCursor={nextCursor}
        />
    )
}

export default GeoFeed