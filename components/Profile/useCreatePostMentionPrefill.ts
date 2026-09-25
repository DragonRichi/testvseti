"use client"

import type {
    Dispatch,
    RefObject,
    SetStateAction
} from "react"
import { useEffect } from "react"

type Props = {
    textareaRef: RefObject<HTMLTextAreaElement | null>
    setContent: Dispatch<SetStateAction<string>>
    setIsExpanded: Dispatch<SetStateAction<boolean>>
}

const MENTION_STORAGE_KEY =
    "vseti:composer-mention"

function useCreatePostMentionPrefill({
    textareaRef,
    setContent,
    setIsExpanded
}: Props) {
    useEffect(() => {
        const mention =
            sessionStorage.getItem(
                MENTION_STORAGE_KEY
            )

        if (!mention) {
            return
        }

        sessionStorage.removeItem(
            MENTION_STORAGE_KEY
        )

        if (
            !/^@[a-z0-9_]{3,30}\s$/i.test(
                mention
            )
        ) {
            return
        }

        setContent(mention)
        setIsExpanded(true)

        requestAnimationFrame(
            () => {
                const textarea =
                    textareaRef.current

                if (!textarea) return

                textarea.focus()

                textarea.setSelectionRange(
                    mention.length,
                    mention.length
                )
            }
        )
    }, [
        setContent,
        setIsExpanded,
        textareaRef
    ])
}

export default useCreatePostMentionPrefill