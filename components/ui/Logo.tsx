"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

function Logo() {
    const pathname = usePathname()
    const isHome = pathname === "/"

    return (
        <Link href={isHome ? "/" : "/feed"} className="flex shrink-0 items-center gap-2">
            <Image src="/logo.svg" alt="ВСети" width={36} height={36} priority unoptimized className="size-9" />

            <span className="text-xl font-bold tracking-tight text-gray-900">
                ВСети
            </span>
        </Link>
    )
}

export default Logo