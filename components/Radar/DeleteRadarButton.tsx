"use client"

import { deleteRadar } from "@/actions/deleteRadar"
import { LoaderCircle, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Props = {
    radarId: string
    radarName: string
    variant?: "button" | "icon"
}

function DeleteRadarButton({ radarId, radarName, variant = "button" }: Props) {
    const router = useRouter()

    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        setError(null)

        startTransition(async () => {
            const result = await deleteRadar(radarId)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setIsOpen(false)
            router.replace("/feed")
            router.refresh()
        })
    }

    return (
        <>
            {variant === "icon" ? (
                <button type="button" onClick={() => setIsOpen(true)} aria-label="Удалить радар" title="Удалить радар" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-main-gray transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                </button>
            ) : (
                <button type="button" onClick={() => setIsOpen(true)} className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 px-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50">
                    <Trash2 className="size-4" />
                    Удалить радар
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-[420] rounded-3xl bg-white p-5 shadow-xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Удалить радар?</h2>
                                <p className="mt-2 text-sm leading-6 text-main-gray">Радар «{radarName}» будет удалён без возможности восстановления.</p>
                            </div>

                            <button type="button" onClick={() => setIsOpen(false)} disabled={isPending} aria-label="Закрыть" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 disabled:cursor-not-allowed">
                                <X className="size-5" />
                            </button>
                        </div>

                        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{error}</div>}

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setIsOpen(false)} disabled={isPending} className="h-11 cursor-pointer rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                                Отмена
                            </button>

                            <button type="button" onClick={handleDelete} disabled={isPending} className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
                                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                {isPending ? "Удаление..." : "Удалить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default DeleteRadarButton