import type { DirectMessage } from "@/types/directMessages"

function compareMessages(
    a: DirectMessage,
    b: DirectMessage
) {
    const byDate =
        a.createdAt.localeCompare(
            b.createdAt
        )

    return byDate !== 0
        ? byDate
        : a.id.localeCompare(b.id)
}

export function mergeDirectRecentMessages(
    current: DirectMessage[],
    recent: DirectMessage[]
) {
    if (recent.length === 0) {
        return current
    }

    const sortedRecent =
        [...recent].sort(
            compareMessages
        )

    const oldestRecent =
        sortedRecent[0]

    const recentIds =
        new Set(
            sortedRecent.map(
                (message) =>
                    message.id
            )
        )

    const older =
        current.filter(
            (message) =>
                !recentIds.has(
                    message.id
                ) &&
                compareMessages(
                    message,
                    oldestRecent
                ) < 0
        )

    return [
        ...older,
        ...sortedRecent
    ].sort(
        compareMessages
    )
}