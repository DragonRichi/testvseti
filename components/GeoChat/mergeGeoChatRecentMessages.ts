import type { GeoChatMessage } from "@/types/geoChat"

function compareMessages(
    first: GeoChatMessage,
    second: GeoChatMessage
) {
    const firstTime =
        new Date(
            first.createdAt
        ).getTime()

    const secondTime =
        new Date(
            second.createdAt
        ).getTime()

    if (
        firstTime !== secondTime
    ) {
        return firstTime - secondTime
    }

    return first.id.localeCompare(
        second.id
    )
}

export function mergeGeoChatRecentMessages(
    currentMessages:
        GeoChatMessage[],
    recentMessages:
        GeoChatMessage[]
) {
    if (
        recentMessages.length === 0
    ) {
        return []
    }

    const sortedRecent =
        [...recentMessages].sort(
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

    const olderMessages =
        currentMessages.filter(
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
        ...olderMessages,
        ...sortedRecent
    ].sort(compareMessages)
}