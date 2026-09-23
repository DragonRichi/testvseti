import DirectConversationList from "@/components/Messages/DirectConversationList"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { loadDirectConversations } from "@/lib/messages/loadDirectConversations"
import { redirect } from "next/navigation"

async function Page() {
    const [viewer, conversations] = await Promise.all([
        getCurrentViewer(),
        loadDirectConversations()
    ])

    if (!viewer) {
        redirect("/")
    }

    return (
        <DirectConversationList
            initialConversations={conversations}
            currentProfileId={viewer.user.id}
        />
    )
}

export default Page
