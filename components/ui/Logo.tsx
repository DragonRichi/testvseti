"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useTransition } from "react"
import type { MouseEvent } from "react"

type Props = {
    compact?: boolean
}

function Logo({ compact = false }: Props) {
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
        <Link href={isHome ? "/" : "/feed"} onClick={handleClick} aria-label="ВСети" className={`flex shrink-0 items-center ${compact ? "justify-center" : "gap-2"}`}>
            <Image src="/logo.svg" alt="ВСети" width={38} height={38} priority unoptimized className={compact ? "size-10" : "size-9"} />

            {!compact && (
                <span className="text-xl font-bold tracking-tight text-[#151915]">
                    ВСети
                </span>
            )}
        </Link>
    )
}

export default Logo
