"use client"

import { ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const PROFILE_LINKS = [
    { title: "Публикации" },
    { title: "Сохранённое" },
    { title: "Друзья" },
    { title: "Группы" },
    { title: "Информация" }
]

function ProfileTabs() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = () => {
        const element = scrollRef.current

        if (!element) return

        const maxScrollLeft = element.scrollWidth - element.clientWidth
        const remainingScroll = maxScrollLeft - element.scrollLeft

        setCanScrollRight(remainingScroll > 8)
    }

    useEffect(() => {
        const element = scrollRef.current

        if (!element) return

        requestAnimationFrame(updateScrollState)

        const resizeObserver = new ResizeObserver(updateScrollState)

        resizeObserver.observe(element)

        return () => resizeObserver.disconnect()
    }, [])

    return (
        <div className="relative mt-5">
            <div ref={scrollRef} onScroll={updateScrollState} className="scrollbar-hide flex overflow-x-auto border-b border-gray-100">
                {PROFILE_LINKS.map((item, index) => (
                    <button key={item.title} type="button" className={`flex h-12 shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm transition-colors ${index === 0 ? "border-main-green font-medium text-main-green" : "border-transparent text-main-gray hover:text-black"}`}>
                        {item.title}
                    </button>
                ))}
            </div>

            <div className={`pointer-events-none absolute right-[-3] top-[-1] flex h-12 w-12 items-center justify-end bg-linear-to-l from-white via-white/90 to-transparent pr-1 transition-opacity duration-200 sm:hidden ${canScrollRight ? "opacity-100" : "opacity-0"}`}>
                <ChevronRight className="size-5 text-main-gray" />
            </div>
        </div>
    )
}

export default ProfileTabs