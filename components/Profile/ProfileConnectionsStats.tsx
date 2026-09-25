"use client"

import UserAvatar from "@/components/ui/UserAvatar"
import type {
    ProfileConnectionCursor,
    ProfileConnectionItem,
    ProfileConnectionType
} from "@/types/follows"
import { useState } from "react"
import ProfileConnectionsPopup from "./ProfileConnectionsPopup"

type ConnectionData = {
    items: ProfileConnectionItem[]
    nextCursor: ProfileConnectionCursor | null
}

type Props = {
    profileId: string
    subscriberCount: number
    followingCount: number
    initialFollowing: ConnectionData
    initialFollowers: ConnectionData
}

function formatCount(
    value: number
) {
    if (value < 1000) {
        return String(value)
    }

    if (value < 1_000_000) {
        const thousands =
            value / 1000

        return Number.isInteger(
            thousands
        )
            ? `${thousands} тыс.`
            : `${thousands
                .toFixed(1)
                .replace(".", ",")} тыс.`
    }

    const millions =
        value / 1_000_000

    return Number.isInteger(
        millions
    )
        ? `${millions} млн`
        : `${millions
            .toFixed(1)
            .replace(".", ",")} млн`
}

function AvatarStack({
    items
}: {
    items: ProfileConnectionItem[]
}) {
    const visibleItems =
        items.slice(0, 4)

    if (
        visibleItems.length === 0
    ) {
        return null
    }

    return (
        <div className="flex shrink-0 items-center">
            {visibleItems.map(
                (item, index) => (
                    <div
                        key={item.id}
                        style={{
                            zIndex:
                                visibleItems.length -
                                index
                        }}
                        className="-ml-1.5 first:ml-0"
                    >
                        <UserAvatar
                            userId={
                                item.id
                            }
                            displayName={
                                item.displayName
                            }
                            avatarUrl={
                                item.avatarUrl
                            }
                            sizeClassName="size-6"
                            textClassName="text-[9px]"
                            priority
                            className="border-2 border-white"
                        />
                    </div>
                )
            )}
        </div>
    )
}

function ProfileConnectionsStats({
    profileId,
    subscriberCount,
    followingCount,
    initialFollowing,
    initialFollowers
}: Props) {
    const [
        popupType,
        setPopupType
    ] =
        useState<ProfileConnectionType | null>(
            null
        )

    const popupData =
        popupType === "following"
            ? initialFollowing
            : initialFollowers

    return (
        <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#777777] sm:text-[13px]">
                <button
                    type="button"
                    onClick={() =>
                        setPopupType(
                            "following"
                        )
                    }
                    className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-70"
                >
                    <AvatarStack
                        items={
                            initialFollowing.items
                        }
                    />

                    <span className="whitespace-nowrap">
                        <strong className="font-bold text-[#171717]">
                            {formatCount(
                                followingCount
                            )}
                        </strong>{" "}
                        в читаемых
                    </span>
                </button>

                <span className="text-[#c7c7c7]">
                    ·
                </span>

                <button
                    type="button"
                    onClick={() =>
                        setPopupType(
                            "followers"
                        )
                    }
                    className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-70"
                >
                    <AvatarStack
                        items={
                            initialFollowers.items
                        }
                    />

                    <span className="whitespace-nowrap">
                        <strong className="font-bold text-[#171717]">
                            {formatCount(
                                subscriberCount
                            )}
                        </strong>{" "}
                        читателей
                    </span>
                </button>
            </div>

            {popupType && (
                <ProfileConnectionsPopup
                    profileId={
                        profileId
                    }
                    type={
                        popupType
                    }
                    initialItems={
                        popupData.items
                    }
                    initialNextCursor={
                        popupData.nextCursor
                    }
                    onClose={() =>
                        setPopupType(
                            null
                        )
                    }
                />
            )}
        </>
    )
}

export default ProfileConnectionsStats