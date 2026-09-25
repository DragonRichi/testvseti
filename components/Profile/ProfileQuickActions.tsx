"use client"

import { AtSign, Bell } from "lucide-react"
import Notifications from "../ui/icons/Notifications"

type Props = {
    username: string
}

function ProfileQuickActions({
    username
}: Props) {
    return (
        <>
            <button
                type="button"
                aria-label={`Упомянуть @${username}`}
                title={`Упомянуть @${username}`}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e3e3e3] bg-white text-[#616161] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
            >
                <AtSign
                    className="size-5"
                    strokeWidth={1.6}
                />
            </button>

            <button
                type="button"
                aria-label="Уведомления о пользователе"
                title="Уведомления о пользователе"
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e3e3e3] bg-white text-[#616161] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717]"
            >
                <Notifications className="size-5"/>
            </button>
        </>
    )
}

export default ProfileQuickActions