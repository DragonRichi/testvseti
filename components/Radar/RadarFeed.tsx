import DeleteRadarButton from "@/components/Radar/DeleteRadarButton"
import RadarFeedList from "@/components/Radar/RadarFeedList"
import { getRadarFeed } from "@/lib/radars/getRadarFeed"
import { getRadarFeedItems } from "@/lib/radars/getRadarFeedItems"
import type { Profile } from "@/types/social"
import { Pencil } from "lucide-react"
import Link from "next/link"

type Props = {
    radarId: string
    currentProfile: Profile
}

async function RadarFeed({ radarId, currentProfile }: Props) {
    const result = await getRadarFeed(radarId)

    if (result.success === false) {
        return (
            <div className="rounded-2xl border border-red-100 bg-white p-5 text-sm text-red-500">
                {result.error}
            </div>
        )
    }

    const { radar, posts, nextCursor } = result

    const radarHeader = (
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{radar.name}</div>
                <div className="text-xs text-main-gray">{radar.type === "tracking" ? "Радар слежения" : "Радар публикаций"}</div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Link href={radar.type === "tracking" ? `/radars/${radar.id}/edit/tracking` : `/radars/${radar.id}/edit`} aria-label="Редактировать радар" title="Редактировать радар" className="flex size-9 shrink-0 items-center justify-center rounded-xl text-main-gray transition-colors hover:bg-green-50 hover:text-main-green">
                    <Pencil className="size-4" />
                </Link>

                <DeleteRadarButton radarId={radar.id} radarName={radar.name} variant="icon" />
            </div>
        </div>
    )

    if (posts.length === 0) {
        return (
            <div>
                {radarHeader}

                <div className="flex min-h-[300] flex-col items-center justify-center rounded-2xl border border-green-100 bg-white px-5 text-center">
                    <div className="text-base font-semibold text-gray-900">
                        Пока нет публикаций
                    </div>

                    <div className="mt-1 text-sm text-main-gray">
                        В радаре «{radar.name}» пока нечего показывать
                    </div>
                </div>
            </div>
        )
    }

    const hydrated = await getRadarFeedItems(posts, currentProfile.id)

    return (
        <div>
            {radarHeader}

            <RadarFeedList key={`${radar.id}:${posts.map((post) => post.id).join(",")}`} radarId={radar.id} currentProfile={currentProfile} initialItems={hydrated.items} initialLikedCommentIds={hydrated.likedCommentIds} initialNextCursor={nextCursor} canPaginate />        </div>
    )
}

export default RadarFeed