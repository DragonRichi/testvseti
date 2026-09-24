import FollowButton from "@/components/Profile/FollowButton"
import UserAvatar from "@/components/ui/UserAvatar"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

type Props = {
    currentProfileId: string
}

type SuggestedProfile = {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
}

async function FeedProfileSuggestions({ currentProfileId }: Props) {
    const supabase = await createClient()

    const [profilesResult, followsResult] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").neq("id", currentProfileId).limit(16),
        supabase.from("follows").select("following_id").eq("follower_id", currentProfileId).limit(200)
    ])

    if (profilesResult.error || followsResult.error) {
        if (profilesResult.error) console.error("FEED SUGGESTED PROFILES ERROR:", profilesResult.error)
        if (followsResult.error) console.error("FEED SUGGESTED FOLLOWS ERROR:", followsResult.error)
        return null
    }

    const followingIds = new Set((followsResult.data ?? []).map((item) => item.following_id))
    const profiles = (profilesResult.data ?? []).filter((profile) => !followingIds.has(profile.id)).slice(0, 6) as SuggestedProfile[]

    if (profiles.length === 0) return null

    return (
        <section className="overflow-hidden rounded-[16px] bg-white px-4 py-4 shadow-[0_1px_0_rgba(18,24,18,0.04)] sm:px-5">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#171b17]">Возможно, вы знакомы</h2>
                <Link href="/search" className="text-xs font-medium text-main-green hover:underline">Показать все</Link>
            </div>

            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {profiles.map((profile) => {
                    const displayName = profile.display_name?.trim() || profile.username

                    return (
                        <div key={profile.id} className="w-[148] shrink-0 rounded-[14px] bg-[#f5f6f3] p-3 text-center">
                            <Link href={`/profile/${profile.username}`} className="mx-auto block w-fit rounded-full">
                                <UserAvatar userId={profile.id} displayName={displayName} avatarUrl={profile.avatar_url} size={54} />
                            </Link>

                            <Link href={`/profile/${profile.username}`} className="mt-2 block truncate text-xs font-semibold text-[#202520] hover:underline">{displayName}</Link>
                            <div className="mt-0.5 truncate text-[10px] text-[#929893]">@{profile.username}</div>

                            <div className="mt-2 flex justify-center [&>button]:h-8 [&>button]:px-3 [&>button]:text-[11px]">
                                <FollowButton profileId={profile.id} username={profile.username} initialFollowing={false} variant="compact" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default FeedProfileSuggestions
