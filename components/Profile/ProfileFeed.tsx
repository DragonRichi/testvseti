import { MessageCircle, PenLine, Share2, ThumbsUp } from "lucide-react"
import Image from "next/image"
import CreatePostCard from "./CreatePostCard"
import PostActions from "./PostActions"

type Profile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
}

type Post = {
    id: string
    user_id: string
    content: string | null
    media_urls: string[] | null
    comment_count: number | null
    like_count: number | null
    view_count: number | null
    share_count: number | null
    created_at: string | null
    visibility: string | null
}

type Props = {
    profile: Profile
    isOwnProfile: boolean
    posts: Post[]
}

const PROFILE_BUTTON = [
    { title: "Фото" },
    { title: "Видео" },
    { title: "Опрос" },
    { title: "Настроение" },
]

function ProfileFeed({ profile, isOwnProfile, posts }: Props) {
    return (
        <div className="mt-4 flex flex-col gap-4">
            {isOwnProfile && (
                <CreatePostCard username={profile.username} displayName={profile.display_name} avatarUrl={profile.avatar_url ?? "/user-avatar.svg"} />
            )}

            {posts.length === 0 ? (
                <div className="flex min-h-[300] flex-col items-center justify-center rounded-2xl border border-green-100 bg-white px-6 py-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-green-50">
                        <PenLine className="size-6 text-main-green" />
                    </div>

                    <h2 className="mt-4 text-lg font-bold">
                        Публикаций пока нет
                    </h2>

                    <p className="mt-2 max-w-[360] text-sm leading-6 text-main-gray">
                        {isOwnProfile ? "Создайте первую публикацию и поделитесь чем-нибудь интересным." : `${profile.display_name} пока ничего не опубликовал.`}
                    </p>
                </div>
            ) : (
                posts.map((post) => (
                    <article key={post.id} className="rounded-2xl border border-green-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                                <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-bold">
                                            {profile.display_name}
                                        </div>

                                        <div className="mt-0.5 text-xs text-main-gray">
                                            @{profile.username}
                                            {post.created_at && (
                                                <> · {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_at))}</>
                                            )}
                                        </div>
                                    </div>

                                    {isOwnProfile && (
                                        <PostActions postId={post.id} username={profile.username} />
                                    )}
                                </div>

                                {post.content && (
                                    <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-800">
                                        {post.content}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3 text-main-gray">
                            <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                                <ThumbsUp className="size-5" />
                                <span>{post.like_count ?? 0}</span>
                            </button>

                            <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                                <MessageCircle className="size-5" />
                                <span>{post.comment_count ?? 0}</span>
                            </button>

                            <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:text-main-green">
                                <Share2 className="size-5" />
                                <span>{post.share_count ?? 0}</span>
                            </button>
                        </div>
                    </article>
                ))
            )}
        </div>
    )
}

export default ProfileFeed
