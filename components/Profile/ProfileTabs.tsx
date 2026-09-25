import type { ProfileTab } from "@/types/profileContent"
import Link from "next/link"

type Props = {
    username: string
    activeTab: ProfileTab
}

const TABS: {
    id: ProfileTab
    label: string
}[] = [
    {
        id: "posts",
        label: "Публикации"
    },
    {
        id: "replies",
        label: "Ответы"
    },
    {
        id: "media",
        label: "Медиафайлы"
    },
    {
        id: "reposts",
        label: "Репосты"
    }
]

function ProfileTabs({
    username,
    activeTab
}: Props) {
    const getHref = (
        tab: ProfileTab
    ) => {
        if (tab === "posts") {
            return `/profile/${username}`
        }

        return `/profile/${username}?tab=${tab}`
    }

    return (
        <div className="mt-4 border-b border-[#e8e8e8]">
            <div className="grid grid-cols-4">
                {TABS.map(
                    (tab) => {
                        const isActive =
                            tab.id ===
                            activeTab

                        return (
                            <Link
                                key={
                                    tab.id
                                }
                                href={getHref(
                                    tab.id
                                )}
                                scroll={false}
                                className={`relative flex h-12 min-w-0 items-center justify-center px-1 text-[11px] font-medium transition-colors sm:text-[13px] ${isActive ? "text-main-green" : "text-[#8f8f8f] hover:text-[#555]"}`}
                            >
                                <span className="truncate">
                                    {
                                        tab.label
                                    }
                                </span>

                                {isActive && (
                                    <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-main-green sm:inset-x-5" />
                                )}
                            </Link>
                        )
                    }
                )}
            </div>
        </div>
    )
}

export default ProfileTabs