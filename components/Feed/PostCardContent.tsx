import type { Post, Profile } from "@/types/social"
import { MapPin } from "lucide-react"

import { PostAuthorLine } from "./PostCardHeader"
import PostMediaGrid from "../Profile/PostMediaGrid"

type Props = {
    post: Post
    profile?: Profile
    eagerMedia: boolean
}

const REGION_NAMES = new Intl.DisplayNames(["ru"], {
    type: "region"
})

function PostCardContent({
    post,
    profile,
    eagerMedia
}: Props) {
    const hasLocation = Boolean(post.tagged_location_name) && typeof post.tagged_lat === "number" && typeof post.tagged_lon === "number"

    const country = post.tagged_country_code
        ? REGION_NAMES.of(post.tagged_country_code)
        : null

    const location = [
        country,
        post.tagged_city,
        post.tagged_location_name
    ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index).join(", ")

    return (
        <>
            {profile && (
                <PostAuthorLine profile={profile} createdAt={post.created_at} />
            )}

            {post.content && (
                <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[15px] leading-[1.45] text-[#202020]">
                    {post.content}
                </p>
            )}

            {(post.media_urls?.length ?? 0) > 0 && (
                <div className="mt-3">
                    <PostMediaGrid mediaUrls={post.media_urls ?? []} eager={eagerMedia} />
                </div>
            )}

            {hasLocation && location && (
                <div className="mt-2 flex min-w-0 items-center gap-1 text-[12px] text-[#999999]">
                    <MapPin className="size-3.5 shrink-0" strokeWidth={1.6} />
                    <span className="truncate">{location}</span>
                </div>
            )}
        </>
    )
}

export default PostCardContent