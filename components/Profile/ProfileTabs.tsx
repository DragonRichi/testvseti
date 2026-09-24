"use client"

import { useState } from "react"

const PROFILE_TABS = [
    "Публикации",
    "Ответы",
    "Медиафайлы",
    "Репосты"
]

function ProfileTabs() {
    const [activeTab, setActiveTab] =
        useState(0)

    return (
        <div className="mt-5 border-t border-[#ededed]">
            <div className="grid grid-cols-4">
                {PROFILE_TABS.map(
                    (title, index) => (
                        <button
                            key={title}
                            type="button"
                            onClick={() =>
                                setActiveTab(
                                    index
                                )
                            }
                            className={`relative flex h-[48] cursor-pointer items-center justify-center whitespace-nowrap px-2 text-[12px] transition-colors sm:text-[13px] ${activeTab === index ? "font-semibold text-main-green" : "font-medium text-[#888888] hover:text-[#333333]"}`}
                        >
                            {title}

                            {activeTab ===
                                index && (
                                    <span className="absolute inset-x-2 bottom-0 h-[2] rounded-full bg-main-green sm:inset-x-4" />
                                )}
                        </button>
                    )
                )}
            </div>
        </div>
    )
}

export default ProfileTabs