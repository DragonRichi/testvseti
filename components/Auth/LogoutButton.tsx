"use client"

import { logout } from "@/actions/logout"
import { LoaderCircle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Props = {
    variant?: "icon" | "menu"
}

function LogoutButton({ variant = "icon" }: Props) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleLogout = () => {
        if (isPending) return

        setError(null)

        startTransition(async () => {
            const result = await logout()

            if (result.success === false) {
                setError(result.error)
                return
            }

            sessionStorage.clear()

            window.dispatchEvent(new Event("vseti:navigation-start"))

            router.replace("/")
            router.refresh()
        })
    }

    if (variant === "menu") {
        return (
            <div>
                <button type="button" onClick={handleLogout} disabled={isPending} className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-wait disabled:opacity-60">
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" strokeWidth={1.8} />}
                    <span>{isPending ? "Выходим..." : "Выйти"}</span>
                </button>

                {error && (
                    <div className="px-3 pb-2 pt-1 text-xs text-red-500">{error}</div>
                )}
            </div>
        )
    }

    return (
        <button type="button" onClick={handleLogout} disabled={isPending} aria-label="Выйти из аккаунта" title="Выйти" className="flex size-10 cursor-pointer items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-wait disabled:opacity-60">
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-5" strokeWidth={1.8} />}
        </button>
    )
}

export default LogoutButton