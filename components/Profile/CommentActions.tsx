"use client"

import { deleteComment } from "@/actions/deleteComment"
import { MoreHorizontal, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
    commentId: string
    postId: string
    username: string
    onDeleted: (commentCount: number) => void
}

function CommentActions({ commentId, postId, username, onDeleted }: Props) {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
    const [isPending, setIsPending] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    const deleteLock = useRef(false)

    useEffect(() => {
        if (!isConfirmOpen) return

        const scrollY = window.scrollY

        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = "0"
        document.body.style.right = "0"
        document.body.style.width = "100%"
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.position = ""
            document.body.style.top = ""
            document.body.style.left = ""
            document.body.style.right = ""
            document.body.style.width = ""
            document.body.style.overflow = ""
            document.documentElement.style.overflow = ""
            window.scrollTo(0, scrollY)
        }
    }, [isConfirmOpen])

    const handleDelete = async () => {
        if (deleteLock.current) return

        deleteLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await deleteComment({ commentId, postId, username })

            if (result.success === false) {
                setError(result.error)
                return
            }

            setIsConfirmOpen(false)
            setIsOpen(false)
            onDeleted(result.commentCount)
        } catch (error) {
            console.error("COMMENT DELETE ERROR:", error)
            setError("Не удалось удалить комментарий")
        } finally {
            deleteLock.current = false
            setIsPending(false)
        }
    }

    return (
        <>
            <div className="relative">
                <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-main-gray transition-colors hover:bg-gray-100 hover:text-black">
                    <MoreHorizontal className="size-4" />
                </button>

                {isOpen && (
                    <>
                        <button type="button" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 cursor-default" aria-label="Закрыть меню" />

                        <div className="absolute right-0 top-8 z-50 w-[190] rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
                            <button type="button" onClick={() => { setIsOpen(false); setIsConfirmOpen(true) }} className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50">
                                <Trash2 className="size-4" />
                                Удалить
                            </button>
                        </div>
                    </>
                )}
            </div>

            {isConfirmOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]">
                    <div className="relative w-full max-w-[400] rounded-2xl bg-white p-5 shadow-2xl">
                        <button type="button" onClick={() => setIsConfirmOpen(false)} className="absolute right-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-xl text-main-gray transition-colors hover:bg-gray-100 hover:text-black">
                            <X className="size-5" />
                        </button>

                        <h2 className="pr-10 text-lg font-bold">
                            Удалить комментарий?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-main-gray">
                            Восстановить комментарий после удаления не получится.
                        </p>

                        {error && (
                            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" disabled={isPending} onClick={() => setIsConfirmOpen(false)} className="h-10 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm font-medium transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                                Отмена
                            </button>

                            <button type="button" disabled={isPending} onClick={handleDelete} className="h-10 cursor-pointer rounded-xl bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50">
                                {isPending ? "Удаляем..." : "Удалить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default CommentActions