"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useTransition } from "react"
import type { MouseEvent } from "react"

function Logo() {
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const refreshStartedRef = useRef(false)

    const isHome = pathname === "/"
    const isFeed = pathname === "/feed"

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (!isFeed) return

        event.preventDefault()

        if (isPending) return

        refreshStartedRef.current = true

        window.dispatchEvent(new Event("vseti:navigation-start"))
        window.scrollTo({ top: 0, behavior: "auto" })

        startTransition(() => {
            router.refresh()
        })
    }

    useEffect(() => {
        if (isPending || !refreshStartedRef.current) return

        refreshStartedRef.current = false
        window.dispatchEvent(new Event("vseti:navigation-end"))
    }, [isPending])

    return (
        <Link href={isHome ? "/" : "/feed"} onClick={handleClick} className="flex shrink-0 items-center gap-2">
            <Image src="/logo.svg" alt="ВСети" width={36} height={36} priority unoptimized className="size-9" />

            <span className="text-xl font-bold tracking-tight text-gray-900">
                ВСети
            </span>
        </Link>
    )
}

export default Logo