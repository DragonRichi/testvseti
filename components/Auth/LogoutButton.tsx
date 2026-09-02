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
        setError(null)

        startTransition(async () => {
            const result = await logout()

            if (result.success === false) {
                setError(result.error)
                return
            }

            sessionStorage.clear()

            router.replace("/")
            router.refresh()
        })
    }

    if (variant === "menu") {
        return (
            <div>
                <button type="button" onClick={handleLogout} disabled={isPending} className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                    {isPending ? <LoaderCircle className="size-5 animate-spin" /> : <LogOut className="size-5" strokeWidth={1.8} />}
                    <span>{isPending ? "Выход..." : "Выйти"}</span>
                </button>

                {error && (
                    <div className="mt-2 text-xs text-red-500">
                        {error}
                    </div>
                )}
            </div>
        )
    }

    return (
        <button type="button" onClick={handleLogout} disabled={isPending} aria-label="Выйти из аккаунта" title="Выйти" className="flex size-10 cursor-pointer items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50">
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-5" strokeWidth={1.8} />}
        </button>
    )
}

export default LogoutButton