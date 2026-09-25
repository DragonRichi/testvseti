import ProfileFeed from "@/components/Profile/ProfileFeed"
import ProfileHeader from "@/components/Profile/ProfileHeader"
import ProfileRepliesFeed from "@/components/Profile/ProfileRepliesFeed"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { loadProfilePostsPage } from "@/lib/profile/loadProfilePostsPage"
import { loadProfileRepliesPage } from "@/lib/profile/loadProfileRepliesPage"
import { createClient } from "@/lib/supabase/server"
import type { ProfilePostMode, ProfileTab } from "@/types/profileContent"
import { Repeat2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{
        username: string
    }>
    searchParams: Promise<{
        tab?: string
    }>
}

function resolveProfileTab(
    value: string | undefined
): ProfileTab {
    if (
        value === "replies" ||
        value === "media" ||
        value === "reposts"
    ) {
        return value
    }

    return "posts"
}

async function Page({
    params,
    searchParams
}: Props) {
    const [
        resolvedParams,
        resolvedSearchParams
    ] = await Promise.all([
        params,
        searchParams
    ])

    const username =
        resolvedParams.username.toLowerCase()

    const activeTab =
        resolveProfileTab(
            resolvedSearchParams.tab
        )

    const supabase =
        await createClient()

    const [
        viewer,
        profileResult
    ] = await Promise.all([
        getCurrentViewer(),
        supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url,cover_url,bio,birth_date,location_label,website_url,subscriber_count,following_count,is_verified,badge_title,interests").eq(
                "username",
                username
            )
            .single()
    ])

    if (!viewer) {
        redirect("/")
    }

    const {
        data: profile,
        error: profileError
    } = profileResult

    if (
        profileError ||
        !profile
    ) {
        console.error(
            "PROFILE LOAD ERROR:",
            profileError
        )

        notFound()
    }

    const isOwnProfile =
        viewer.user.id ===
        profile.id

    const followPromise =
        isOwnProfile
            ? Promise.resolve({
                data: null,
                error: null
            })
            : supabase
                .from("follows")
                .select(
                    "following_id"
                )
                .eq(
                    "follower_id",
                    viewer.user.id
                )
                .eq(
                    "following_id",
                    profile.id
                )
                .maybeSingle()

    const contentPromise =
        (async () => {
            if (
                activeTab === "posts" ||
                activeTab === "media"
            ) {
                const mode: ProfilePostMode =
                    activeTab === "media"
                        ? "media"
                        : "posts"

                const page =
                    await loadProfilePostsPage({
                        supabase,
                        profileId: profile.id,
                        viewerId: viewer.user.id,
                        mode
                    })

                return {
                    kind: "posts" as const,
                    mode,
                    ...page
                }
            }

            if (
                activeTab ===
                "replies"
            ) {
                const page =
                    await loadProfileRepliesPage({
                        supabase,
                        profileId:
                            profile.id
                    })

                return {
                    kind:
                        "replies" as const,
                    ...page
                }
            }

            return {
                kind:
                    "reposts" as const
            }
        })()

    const [
        followResult,
        content
    ] = await Promise.all([
        followPromise,
        contentPromise
    ])

    if (followResult.error) {
        console.error(
            "PROFILE FOLLOW LOAD ERROR:",
            followResult.error
        )
    }

    return (
        <>
            <ProfileHeader
                profile={
                    profile
                }
                isOwnProfile={
                    isOwnProfile
                }
                isFollowing={Boolean(
                    followResult.data
                )}
                activeTab={
                    activeTab
                }
            />

            {content.kind ===
                "posts" && (
                    <ProfileFeed
                        profile={profile}
                        posts={content.posts}
                        initialCursor={content.nextCursor}
                        isOwnProfile={isOwnProfile}
                        likedPostIds={content.likedPostIds}
                        currentProfile={viewer.profile}
                        mode={content.mode}
                    />
                )}

            {content.kind ===
                "replies" && (
                    <ProfileRepliesFeed
                        profile={
                            profile
                        }
                        initialItems={
                            content.items
                        }
                        initialCursor={
                            content.nextCursor
                        }
                    />
                )}

            {content.kind ===
                "reposts" && (
                    <div className="flex min-h-[280] flex-col items-center justify-center bg-white px-6 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-[#edf9ee]">
                            <Repeat2 className="size-6 text-main-green" />
                        </div>

                        <div className="mt-4 text-[16px] font-semibold text-[#171717]">
                            Репостов пока нет
                        </div>

                        <div className="mt-2 max-w-[360] text-[13px] leading-5 text-[#999]">
                            Репосты пользователя будут отображаться здесь после подключения функции репоста.
                        </div>
                    </div>
                )}
        </>
    )
}

export default Page