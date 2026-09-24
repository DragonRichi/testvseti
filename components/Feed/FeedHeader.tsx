"use client"

import type { UserRadar } from "@/lib/radars/getUserRadars"
import Link from "next/link"
import FeedRadarMenu from "./FeedRadarMenu"

type Props = {
    radars: UserRadar[]
    activeRadarId: string | null
}

function FeedHeader({
    radars,
    activeRadarId
}: Props) {
    const isMainFeed = activeRadarId === null

    return (
        <header className="sticky top-0 z-30 hidden h-[56] items-center bg-[#f7f7f7]/95 backdrop-blur-xl lg:flex">
            <Link
                href="/feed"
                className={`relative flex h-full items-center px-1 pr-5 text-[15px] font-semibold transition-colors ${isMainFeed ? "text-[#171717]" : "text-[#8b918c] hover:text-[#555]"}`}
            >
                Для вас

                {isMainFeed && (
                    <span className="absolute inset-x-1 bottom-0 h-[2] rounded-full bg-main-green" />
                )}
            </Link>

            <FeedRadarMenu
                radars={radars}
                activeRadarId={activeRadarId}
            />

            <Link
                href="/geochats"
                className="relative flex h-full items-center px-5 text-[15px] font-medium text-[#8b918c] transition-colors hover:text-[#171717]"
            >
                Геочаты
            </Link>
        </header>
    )
}

export default FeedHeader