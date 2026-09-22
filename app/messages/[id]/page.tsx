import SocialLayout from "@/components/Layout/SocialLayout"
import DirectConversationRoom from "@/components/Messages/DirectConversationRoom"
import { loadDirectConversation } from "@/lib/messages/loadDirectConversation"
import { loadDirectMessages } from "@/lib/messages/loadDirectMessages"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"
import {
    notFound,
    redirect
} from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

async function Page({
    params
}: Props) {
    const {
        id
    } =
        await params

    if (!isUuid(id)) {
        notFound()
    }

    const supabase =
        await createClient()

    const {
        data: {
            user
        }
    } =
        await supabase.auth.getUser()

    if (!user) {
        redirect("/")
    }

    const [
        {
            data:
            currentProfile,
            error:
            profileError
        },
        conversation,
        messagePage
    ] =
        await Promise.all([
            supabase
                .from(
                    "profiles"
                )
                .select(
                    "id,username,display_name,avatar_url"
                )
                .eq(
                    "id",
                    user.id
                )
                .single(),

            loadDirectConversation(
                id
            ),

            loadDirectMessages(
                id
            )
        ])

    if (
        profileError ||
        !currentProfile
    ) {
        console.error(
            "DIRECT ROOM PROFILE LOAD ERROR:",
            profileError
        )

        redirect("/")
    }

    if (!conversation) {
        notFound()
    }

    return (
        <SocialLayout
            profile={
                currentProfile
            }
        >
            <DirectConversationRoom
                conversation={
                    conversation
                }
                initialMessages={
                    messagePage.messages
                }
                initialHasMore={
                    messagePage.hasMore
                }
                currentProfile={
                    currentProfile
                }
            />
        </SocialLayout>
    )
}

export default Page