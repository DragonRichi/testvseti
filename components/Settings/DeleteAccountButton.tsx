"use client"

import { deleteAccount } from "@/actions/deleteAccount"
import { LoaderCircle, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

function DeleteAccountButton() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleDelete = () => {
        const confirmed = window.confirm("Удалить аккаунт навсегда? Все публикации, комментарии, фотографии и данные будут удалены без возможности восстановления.")

        if (!confirmed) return

        setError(null)

        startTransition(async () => {
            const result = await deleteAccount()

            if (result.success === false) {
                setError(result.error)
            }
        })
    }

    return (
        <div>
            <button type="button" onClick={handleDelete} disabled={isPending} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <Trash2 className="size-4" />
                )}

                {isPending ? "Удаление..." : "Удалить аккаунт"}
            </button>

            {error && (
                <div className="mt-3 text-sm text-red-500">
                    {error}
                </div>
            )}
        </div>
    )
}

export default DeleteAccountButton