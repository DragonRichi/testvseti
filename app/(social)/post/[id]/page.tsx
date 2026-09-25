import PostCard from "@/components/Profile/PostCard"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import type { Post, Profile } from "@/types/social"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

async function Page({
    params
}: Props) {
    const { id } =
        await params

    if (!isUuid(id)) {
        notFound()
    }

    const [
        viewer,
        supabase
    ] = await Promise.all([
        getCurrentViewer(),
        createClient()
    ])

    if (!viewer) {
        redirect("/")
    }

    const {
        data: postData,
        error: postError
    } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (
        postError ||
        !postData
    ) {
        console.error(
            "POST PAGE LOAD ERROR:",
            postError
        )

        notFound()
    }

    const post =
        postData as Post

    const [
        authorResult,
        likeResult
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("*")
            .eq(
                "id",
                post.user_id
            )
            .maybeSingle(),

        supabase
            .from("post_likes")
            .select("post_id")
            .eq(
                "post_id",
                post.id
            )
            .eq(
                "user_id",
                viewer.user.id
            )
            .maybeSingle()
    ])

    if (
        authorResult.error ||
        !authorResult.data
    ) {
        console.error(
            "POST AUTHOR LOAD ERROR:",
            authorResult.error
        )

        notFound()
    }

    if (likeResult.error) {
        console.error(
            "POST LIKE STATE ERROR:",
            likeResult.error
        )
    }

    const author =
        authorResult.data as Profile

    const isOwnProfile =
        author.id ===
        viewer.user.id

    return (
        <div className="overflow-hidden rounded-3xl bg-white">
            <div className="flex h-14 items-center border-b border-[#ededed] px-4 sm:h-16 sm:px-5">
                <Link
                    href={`/profile/${author.username}`}
                    aria-label="Назад"
                    className="flex size-9 items-center justify-center rounded-full bg-white text-[#616161] transition-colors hover:bg-[#f3f3f3] hover:text-[#171717]"
                >
                    <ArrowLeft
                        className="size-5"
                        strokeWidth={1.7}
                    />
                </Link>

                <div className="ml-3">
                    <div className="text-[15px] font-semibold text-[#171717]">
                        Публикация
                    </div>

                    <div className="text-[11px] text-[#999]">
                        @{author.username}
                    </div>
                </div>
            </div>

            <PostCard
                profile={author}
                post={post}
                isOwnProfile={isOwnProfile}
                initialLiked={Boolean(
                    likeResult.data
                )}
                currentProfile={
                    viewer.profile
                }
                eagerMedia
            />
        </div>
    )
}

export default Page