import DirectConversationList from "@/components/Messages/DirectConversationList"
import { loadDirectConversations } from "@/lib/messages/loadDirectConversations"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/")
    }

    const conversations = await loadDirectConversations()

    return (
        <DirectConversationList initialConversations={conversations} currentProfileId={user.id} />
    )
}

export default Page
