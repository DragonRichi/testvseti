"use client"

import { deleteUserByUsername } from "@/actions/deleteUserByUsername"
import { LoaderCircle, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

function DevDeleteUser() {
    const [username, setUsername] = useState("")
    const [message, setMessage] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        const normalizedUsername = username.trim().replace(/^@/, "")

        if (!normalizedUsername) {
            setIsSuccess(false)
            setMessage("Введите username")
            return
        }

        const confirmed = window.confirm(`Удалить тестовый аккаунт @${normalizedUsername}?\n\nБудут удалены пользователь, профиль, публикации и файлы Storage.`)

        if (!confirmed) return

        setMessage(null)

        startTransition(async () => {
            const result = await deleteUserByUsername(normalizedUsername)

            setIsSuccess(result.success)
            setMessage(result.message)

            if (result.success) {
                setUsername("")
            }
        })
    }

    return (
        <div className="relative flex items-center gap-2">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDelete()} disabled={isPending} placeholder="@username" className="h-9 w-[150] rounded-xl border border-red-200 bg-white px-3 text-xs outline-none transition-colors placeholder:text-gray-400 focus:border-red-400 disabled:opacity-60" />

            <button type="button" onClick={handleDelete} disabled={isPending || !username.trim()} title="Удалить тестового пользователя" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>

            {message && (
                <div className={`absolute right-0 top-[44] z-50 whitespace-nowrap rounded-lg border bg-white px-3 py-2 text-xs shadow-lg ${isSuccess ? "border-green-100 text-main-green" : "border-red-100 text-red-500"}`}>
                    {message}
                </div>
            )}
        </div>
    )
}

export default DevDeleteUser