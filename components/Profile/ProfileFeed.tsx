import { PenLine } from "lucide-react"
import CreatePostCard from "./CreatePostCard"
import PostCard from "./PostCard"

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
    posts: Post[]
    isOwnProfile: boolean
}

function ProfileFeed({ profile, posts, isOwnProfile }: Props) {
    return (
        <div className="mt-4 flex flex-col gap-4">
            {isOwnProfile && (
                <CreatePostCard username={profile.username} displayName={profile.display_name} avatarUrl={profile.avatar_url} />
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
                    <PostCard key={post.id} profile={profile} post={post} isOwnProfile={isOwnProfile} />
                ))
            )}
        </div>
    )
}

export default ProfileFeed