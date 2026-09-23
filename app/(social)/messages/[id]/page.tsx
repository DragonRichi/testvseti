import DirectConversationRoom from "@/components/Messages/DirectConversationRoom"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { loadDirectConversation } from "@/lib/messages/loadDirectConversation"
import { loadDirectMessages } from "@/lib/messages/loadDirectMessages"
import { isUuid } from "@/lib/validation/uuid"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

async function Page({ params }: Props) {
    const { id } = await params

    if (!isUuid(id)) {
        notFound()
    }

    const [viewer, conversation, messagePage] = await Promise.all([
        getCurrentViewer(),
        loadDirectConversation(id),
        loadDirectMessages(id)
    ])

    if (!viewer) {
        redirect("/")
    }

    if (!conversation) {
        notFound()
    }

    return (
        <DirectConversationRoom
            conversation={conversation}
            initialMessages={messagePage.messages}
            initialHasMore={messagePage.hasMore}
            currentProfile={viewer.profile}
        />
    )
}

export default Page
