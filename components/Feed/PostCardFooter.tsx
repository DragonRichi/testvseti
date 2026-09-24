import type { Post } from "@/types/social"
import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react"
import PostActions from "../Profile/PostActions"
import Share from "../ui/icons/Share"


type Props = {
    post: Post
    username: string
    isOwnProfile: boolean
    isLiked: boolean
    likeCount: number
    commentCount: number
    isCommentsOpen: boolean
    onLike: () => void
    onToggleComments: () => void
    onEdit: () => void
    onDeleted: (postId: string) => void
}

function PostCardFooter({
    post,
    username,
    isOwnProfile,
    isLiked,
    likeCount,
    commentCount,
    isCommentsOpen,
    onLike,
    onToggleComments,
    onEdit,
    onDeleted
}: Props) {
    return (
        <div className="mt-2 flex h-9 items-center text-[#666666]">
            <div className="flex items-center gap-4">
                <button type="button" onClick={onLike} className={`flex h-8 cursor-pointer items-center gap-1.5 text-[13px] transition-colors ${isLiked ? "text-[#28b555]" : "hover:text-[#28b555]"}`}>
                    <Heart className={`size-[18] ${isLiked ? "fill-[#28b555]" : ""}`} strokeWidth={1.6} />
                    <span>{likeCount}</span>
                </button>

                <button type="button" onClick={onToggleComments} className={`flex h-8 cursor-pointer items-center gap-1.5 text-[13px] transition-colors ${isCommentsOpen ? "text-[#28b555]" : "hover:text-[#28b555]"}`}>
                    <MessageCircle className="size-[18]" strokeWidth={1.6} />
                    <span>{commentCount}</span>
                </button>

                <button type="button" className="flex h-8 cursor-pointer items-center gap-1.5 text-[13px] transition-colors hover:text-[#28b555]">
                    <Repeat2 className="size-[18]" strokeWidth={1.6} />
                    <span>{post.share_count ?? 0}</span>
                </button>
            </div>

            <div className="ml-auto flex items-center gap-1">
                <button type="button" aria-label="Сохранить" className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#f3f3f3] hover:text-[#28b555]">
                    <Bookmark className="size-[18]" strokeWidth={1.6} />
                </button>

                <button type="button" aria-label="Поделиться" className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#f3f3f3] hover:text-[#28b555]">
                    <Share className="size-6" />
                </button>

                {isOwnProfile && (
                    <PostActions postId={post.id} username={username} onEdit={onEdit} onDeleted={onDeleted} />
                )}
            </div>
        </div>
    )
}

export default PostCardFooter