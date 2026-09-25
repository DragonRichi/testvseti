import UserAvatar from "@/components/ui/UserAvatar"
import type { ProfileReplyItem } from "@/types/profileContent"
import type { Profile } from "@/types/social"
import { CornerUpLeft, Images } from "lucide-react"
import Link from "next/link"

type Props = {
    profile: Profile
    item: ProfileReplyItem
}

const DATE_FORMATTER =
    new Intl.DateTimeFormat(
        "ru-RU",
        {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    )

function ProfileReplyCard({
    profile,
    item
}: Props) {
    const mediaCount =
        item.post.media_urls?.length ??
        0

    return (
        <article className="border-b border-[#e5e5e5] bg-white px-4 py-5 sm:px-5">
            <div className="flex items-start gap-3">
                <Link
                    href={`/profile/${profile.username}`}
                    className="shrink-0 rounded-full"
                >
                    <UserAvatar
                        userId={profile.id}
                        displayName={profile.display_name}
                        avatarUrl={profile.avatar_url}
                        size={40}
                    />
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <Link
                            href={`/profile/${profile.username}`}
                            className="max-w-full truncate text-[14px] font-semibold text-[#171717] hover:underline"
                        >
                            {profile.display_name}
                        </Link>

                        <span className="text-[12px] text-[#999]">
                            @{profile.username}
                        </span>

                        <span className="shrink-0 text-[11px] text-[#aaa]">
                            ·{" "}
                            {DATE_FORMATTER.format(
                                new Date(
                                    item.createdAt
                                )
                            )}
                        </span>
                    </div>

                    {item.postAuthor && (
                        <div className="mt-1 flex items-center gap-1 text-[12px] text-[#999]">
                            <CornerUpLeft
                                className="size-3.5 shrink-0"
                                strokeWidth={1.6}
                            />

                            <span>
                                Ответ
                            </span>

                            <Link
                                href={`/profile/${item.postAuthor.username}`}
                                className="font-medium text-main-green hover:underline"
                            >
                                @{item.postAuthor.username}
                            </Link>
                        </div>
                    )}

                    <div className="mt-2 whitespace-pre-wrap wrap-break-word text-[14px] leading-6 text-[#303030]">
                        {item.content}
                    </div>

                    <Link
                        href={`/post/${item.postId}`}
                        className="mt-3 block w-full cursor-pointer rounded-xl border border-[#e7e7e7] bg-[#fafafa] p-3 transition-colors hover:border-[#d8d8d8] hover:bg-[#f7f7f7]"
                    >
                        {item.postAuthor && (
                            <div className="flex min-w-0 items-center gap-2">
                                <UserAvatar
                                    userId={item.postAuthor.id}
                                    displayName={item.postAuthor.display_name}
                                    avatarUrl={item.postAuthor.avatar_url}
                                    size={28}
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <span className="truncate text-[12px] font-semibold text-[#333]">
                                            {item.postAuthor.display_name}
                                        </span>

                                        <span className="truncate text-[11px] text-[#999]">
                                            @{item.postAuthor.username}
                                        </span>
                                    </div>

                                    {item.post.created_at && (
                                        <div className="mt-0.5 text-[10px] text-[#aaa]">
                                            {DATE_FORMATTER.format(
                                                new Date(
                                                    item.post.created_at
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {item.post.content && (
                            <div className="mt-2 line-clamp-3 whitespace-pre-wrap wrap-break-word text-[13px] leading-5 text-[#555]">
                                {item.post.content}
                            </div>
                        )}

                        {mediaCount > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#999]">
                                <Images
                                    className="size-3.5"
                                    strokeWidth={1.6}
                                />

                                <span>
                                    {mediaCount}{" "}
                                    {mediaCount === 1
                                        ? "фото"
                                        : "фото"}
                                </span>
                            </div>
                        )}

                        <div className="mt-2 text-[11px] font-medium text-main-green">
                            Открыть публикацию
                        </div>
                    </Link>
                </div>
            </div>
        </article>
    )
}

export default ProfileReplyCard