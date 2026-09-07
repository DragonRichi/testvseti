"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

type Props = {
    href: string
    children: React.ReactNode
    pendingText?: string
    className?: string
}

function NavigationButton({ href, children, pendingText = "Загрузка...", className = "" }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleClick = () => {
        if (isPending) return

        startTransition(() => {
            router.push(href)
        })
    }

    return (
        <button type="button" onClick={handleClick} disabled={isPending} className={`${className} active:scale-[0.98] disabled:cursor-wait disabled:opacity-80`}>
            {isPending ? (
                <>
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>{pendingText}</span>
                </>
            ) : (
                children
            )}
        </button>
    )
}

export default NavigationButton