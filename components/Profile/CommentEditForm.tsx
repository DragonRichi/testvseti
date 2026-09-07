"use client"

import { updateComment } from "@/actions/updateComment"
import { useRef, useState } from "react"

type Props = {
    commentId: string
    username: string
    initialContent: string
    onCancel: () => void
    onSaved: (content: string, updatedAt: string) => void
}

function CommentEditForm({ commentId, username, initialContent, onCancel, onSaved }: Props) {
    const [content, setContent] = useState(initialContent)
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)
    const updateLock = useRef(false)

    const handleUpdate = async () => {
        if (updateLock.current) return

        const normalizedContent = content.trim()

        if (!normalizedContent) {
            setError("Введите комментарий")
            return
        }

        if (normalizedContent.length > 2000) {
            setError("Комментарий не должен превышать 2000 символов")
            return
        }

        updateLock.current = true
        setIsPending(true)
        setError("")

        try {
            const result = await updateComment({ commentId, content: normalizedContent, username })

            if (result.success === false) {
                setError(result.error)
                return
            }

            onSaved(result.comment.content, result.comment.updated_at)
        } catch (error) {
            console.error("COMMENT UPDATE ERROR:", error)
            setError("Не удалось изменить комментарий")
        } finally {
            updateLock.current = false
            setIsPending(false)
        }
    }

    return (
        <div className="mt-2">
            <textarea value={content} onChange={(event) => { setContent(event.target.value); setError("") }} maxLength={2000} autoFocus className="min-h-[90] w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-main-green/40" />

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="mr-auto text-xs text-main-gray">{content.length}/2000</span>

                <div className="ml-auto flex items-center gap-2">
                    <button type="button" disabled={isPending} onClick={onCancel} className="h-8 cursor-pointer rounded-lg border border-gray-200 px-2.5 text-xs transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">Отмена</button>

                    <button type="button" disabled={isPending || !content.trim()} onClick={() => void handleUpdate()} className="h-8 cursor-pointer rounded-lg bg-main-green px-2.5 text-xs font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">{isPending ? "..." : "Сохранить"}</button>
                </div>
            </div>

            {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
        </div>
    )
}

export default CommentEditForm