import type { ProfilePostMode, ProfilePostsCursor } from "@/types/profileContent"
import type { Post, Profile } from "@/types/social"
import { Images, PenLine } from "lucide-react"
import CreatePostCard from "./CreatePostCard"
import PostCard from "./PostCard"
import ProfilePostPagination from "./ProfilePostPagination"

type Props = {
    profile: Profile
    posts: Post[]
    initialCursor: ProfilePostsCursor | null
    isOwnProfile: boolean
    likedPostIds: string[]
    currentProfile: Profile
    mode: ProfilePostMode
}

function ProfileFeed({
    profile,
    posts,
    initialCursor,
    isOwnProfile,
    likedPostIds,
    currentProfile,
    mode
}: Props) {
    const isMedia =
        mode === "media"

    return (
        <div className="flex flex-col">
            {isOwnProfile &&
                !isMedia && (
                    <div className="border-b border-[#e5e5e5] bg-white">
                        <CreatePostCard
                            username={
                                profile.username
                            }
                            displayName={
                                profile.display_name
                            }
                            avatarUrl={
                                profile.avatar_url
                            }
                        />
                    </div>
                )}

            {posts.length === 0 &&
            !initialCursor ? (
                <div className="flex min-h-[280] flex-col items-center justify-center bg-white px-6 py-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-[#edf9ee]">
                        {isMedia ? (
                            <Images className="size-6 text-main-green" />
                        ) : (
                            <PenLine className="size-6 text-main-green" />
                        )}
                    </div>

                    <h2 className="mt-4 text-[16px] font-semibold text-[#171717]">
                        {isMedia
                            ? "Медиафайлов пока нет"
                            : "Публикаций пока нет"}
                    </h2>

                    <p className="mt-2 max-w-[360] text-[13px] leading-5 text-[#999]">
                        {isMedia
                            ? "Публикации с фотографиями будут отображаться здесь."
                            : isOwnProfile
                                ? "Создайте первую публикацию."
                                : `${profile.display_name} пока ничего не опубликовал.`}
                    </p>
                </div>
            ) : (
                <>
                    {posts.map(
                        (
                            post,
                            index
                        ) => (
                            <PostCard
                                key={
                                    post.id
                                }
                                profile={
                                    profile
                                }
                                post={
                                    post
                                }
                                isOwnProfile={
                                    isOwnProfile
                                }
                                initialLiked={likedPostIds.includes(
                                    post.id
                                )}
                                currentProfile={
                                    currentProfile
                                }
                                eagerMedia={
                                    index ===
                                    0
                                }
                            />
                        )
                    )}

                    <ProfilePostPagination
                        profile={
                            profile
                        }
                        currentProfile={
                            currentProfile
                        }
                        isOwnProfile={
                            isOwnProfile
                        }
                        initialPostIds={posts.map(
                            (post) =>
                                post.id
                        )}
                        initialCursor={
                            initialCursor
                        }
                        mode={mode}
                    />
                </>
            )}
        </div>
    )
}

export default ProfileFeed