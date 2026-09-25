"use client"

import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarDays, ChevronDown, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { DayPicker } from "react-day-picker"

type Props = {
    value: string
    onChange: (value: string) => void
}

function ProfileBirthDatePicker({
    value,
    onChange
}: Props) {
    const rootRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    const selectedDate =
        value
            ? parseISO(value)
            : undefined

    const maxDate = new Date()

    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (
            event: PointerEvent
        ) => {
            if (
                rootRef.current?.contains(
                    event.target as Node
                )
            ) {
                return
            }

            setIsOpen(false)
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape"
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        )

        document.addEventListener(
            "keydown",
            handleKeyDown
        )

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            )

            document.removeEventListener(
                "keydown",
                handleKeyDown
            )
        }
    }, [isOpen])

    return (
        <div
            ref={rootRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (current) =>
                            !current
                    )
                }
                className={`flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 text-left text-sm transition-colors ${isOpen ? "border-main-green" : "border-[#e2e2e2] hover:border-[#cfcfcf]"}`}
            >
                <CalendarDays
                    className="size-[18] shrink-0 text-[#777]"
                    strokeWidth={1.6}
                />

                <span
                    className={
                        selectedDate
                            ? "min-w-0 flex-1 text-[#202020]"
                            : "min-w-0 flex-1 text-[#999]"
                    }
                >
                    {selectedDate
                        ? format(
                            selectedDate,
                            "d MMMM yyyy",
                            {
                                locale: ru
                            }
                        )
                        : "Выберите дату"}
                </span>

                {value ? (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(
                            event
                        ) => {
                            event.stopPropagation()
                            onChange("")
                        }}
                        onKeyDown={(
                            event
                        ) => {
                            if (
                                event.key ===
                                "Enter" ||
                                event.key ===
                                " "
                            ) {
                                event.preventDefault()
                                event.stopPropagation()
                                onChange("")
                            }
                        }}
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f2f2f2] hover:text-[#444]"
                    >
                        <X className="size-4" />
                    </span>
                ) : (
                    <ChevronDown
                        className={`size-4 shrink-0 text-[#999] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-[52] z-100 w-[330] max-w-[calc(100vw-32px)] rounded-2xl border border-[#e7e7e7] bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (!date) return

                            onChange(
                                format(
                                    date,
                                    "yyyy-MM-dd"
                                )
                            )

                            setIsOpen(false)
                        }}
                        locale={ru}
                        startMonth={
                            new Date(
                                1940,
                                0
                            )
                        }
                        endMonth={maxDate}
                        defaultMonth={
                            selectedDate ??
                            new Date(
                                2000,
                                0
                            )
                        }
                        disabled={{
                            after: maxDate
                        }}
                        captionLayout="dropdown"
                        classNames={{
                            root: "w-full",
                            months: "w-full",
                            month: "w-full",
                            month_caption: "mb-3 flex h-10 items-center justify-center",
                            dropdowns: "flex items-center justify-center gap-2",

                            dropdown_root: "relative h-10 min-w-[118] rounded-xl border border-[#e7e7e7] bg-white",
                            dropdown: "absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0",
                            caption_label: "pointer-events-none flex h-full items-center justify-between gap-2 px-3 text-sm font-semibold text-[#202020]",
                            chevron: "size-4 fill-[#777] text-[#777]",

                            month_grid: "w-full border-collapse",
                            weekdays: "grid grid-cols-7",
                            weekday: "flex h-8 items-center justify-center text-[11px] font-medium text-[#999]",
                            week: "mt-1 grid grid-cols-7",
                            day: "flex size-10 items-center justify-center",
                            day_button: "flex size-9 cursor-pointer items-center justify-center rounded-full text-[13px] font-medium text-[#333] transition-colors hover:bg-[#f2f4f2]",
                            selected: "[&>button]:bg-main-green [&>button]:text-white [&>button]:hover:bg-main-green",
                            today: "[&>button]:font-bold [&>button]:text-main-green",
                            outside: "opacity-30",
                            disabled: "pointer-events-none opacity-25"
                        }}
                    />

                    <div className="mt-2 flex items-center justify-between border-t border-[#ededed] pt-3">
                        <button
                            type="button"
                            onClick={() => {
                                onChange("")
                                setIsOpen(false)
                            }}
                            className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-[#777] transition-colors hover:bg-[#f4f4f4]"
                        >
                            Очистить
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onChange(
                                    format(
                                        maxDate,
                                        "yyyy-MM-dd"
                                    )
                                )

                                setIsOpen(false)
                            }}
                            className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-main-green transition-colors hover:bg-[#eef9f1]"
                        >
                            Сегодня
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfileBirthDatePicker