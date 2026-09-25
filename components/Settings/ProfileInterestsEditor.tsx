"use client"

import { Plus, X } from "lucide-react"
import { KeyboardEvent, useState } from "react"

type Props = {
    value: string[]
    onChange: (value: string[]) => void
}

const MAX_INTERESTS = 10
const MAX_LENGTH = 30
const MIN_LENGTH = 2

const INTEREST_PATTERN =
    /^[\p{L}\p{N}][\p{L}\p{N}\s+#&-]*$/u

function normalizeInterest(
    value: string
) {
    return value
        .trim()
        .replace(/\s+/g, " ")
}

function ProfileInterestsEditor({
    value,
    onChange
}: Props) {
    const [input, setInput] =
        useState("")

    const [error, setError] =
        useState("")

    const addInterest = (
        rawValue = input
    ) => {
        const interest =
            normalizeInterest(
                rawValue
            )

        if (!interest) {
            return
        }

        if (
            value.length >=
            MAX_INTERESTS
        ) {
            setError(
                `Можно добавить не более ${MAX_INTERESTS} интересов`
            )
            return
        }

        if (
            interest.length <
            MIN_LENGTH
        ) {
            setError(
                `Минимум ${MIN_LENGTH} символа`
            )
            return
        }

        if (
            interest.length >
            MAX_LENGTH
        ) {
            setError(
                `Не более ${MAX_LENGTH} символов`
            )
            return
        }

        if (
            !INTEREST_PATTERN.test(
                interest
            )
        ) {
            setError(
                "Используйте буквы, цифры, пробел, -, +, # или &"
            )
            return
        }

        const exists =
            value.some(
                (item) =>
                    item.toLocaleLowerCase(
                        "ru"
                    ) ===
                    interest.toLocaleLowerCase(
                        "ru"
                    )
            )

        if (exists) {
            setError(
                "Такой интерес уже добавлен"
            )
            return
        }

        onChange([
            ...value,
            interest
        ])

        setInput("")
        setError("")
    }

    const removeInterest = (
        index: number
    ) => {
        onChange(
            value.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        )

        setError("")
    }

    const handleKeyDown = (
        event: KeyboardEvent<HTMLInputElement>
    ) => {
        if (
            event.key === "Enter" ||
            event.key === ","
        ) {
            event.preventDefault()
            addInterest()
        }

        if (
            event.key ===
                "Backspace" &&
            !input &&
            value.length > 0
        ) {
            removeInterest(
                value.length - 1
            )
        }
    }

    return (
        <div>
            <div className="min-h-[48] rounded-xl border border-[#e2e2e2] bg-white px-2 py-2 transition-colors focus-within:border-main-green">
                <div className="flex flex-wrap items-center gap-2">
                    {value.map(
                        (
                            interest,
                            index
                        ) => (
                            <span
                                key={`${interest}-${index}`}
                                className="flex h-8 items-center gap-1.5 rounded-xl bg-[#f2f4f2] px-3 text-[13px] font-medium text-[#555]"
                            >
                                {interest}

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeInterest(
                                            index
                                        )
                                    }
                                    aria-label={`Удалить ${interest}`}
                                    className="flex size-5 cursor-pointer items-center justify-center rounded-full text-[#999] transition-colors hover:bg-[#e4e6e4] hover:text-[#333]"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </span>
                        )
                    )}

                    {value.length <
                        MAX_INTERESTS && (
                        <div className="flex min-w-[160] flex-1 items-center">
                            <input
                                value={
                                    input
                                }
                                onChange={(
                                    event
                                ) => {
                                    setInput(
                                        event
                                            .target
                                            .value
                                            .replace(
                                                /,/g,
                                                ""
                                            )
                                    )

                                    setError(
                                        ""
                                    )
                                }}
                                onKeyDown={
                                    handleKeyDown
                                }
                                maxLength={
                                    MAX_LENGTH
                                }
                                placeholder={
                                    value.length ===
                                    0
                                        ? "Например, фотография"
                                        : "Ещё интерес"
                                }
                                className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-[14px] text-[#202020] outline-none placeholder:text-[#aaa]"
                            />

                            {input.trim() && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        addInterest()
                                    }
                                    aria-label="Добавить интерес"
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-main-green transition-colors hover:bg-[#eef9f1]"
                                >
                                    <Plus className="size-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                    {error ? (
                        <span className="text-xs text-red-500">
                            {error}
                        </span>
                    ) : (
                        <span className="text-xs text-[#999]">
                            Нажмите Enter или запятую, чтобы добавить интерес
                        </span>
                    )}
                </div>

                <span className="shrink-0 text-xs text-[#aaa]">
                    {value.length}/
                    {MAX_INTERESTS}
                </span>
            </div>
        </div>
    )
}

export default ProfileInterestsEditor