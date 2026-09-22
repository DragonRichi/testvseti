import DirectConversationList from "@/components/Messages/DirectConversationList"
import SocialLayout from "@/components/Layout/SocialLayout"
import { loadDirectConversations } from "@/lib/messages/loadDirectConversations"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
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
        conversations
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

            loadDirectConversations()
        ])

    if (
        profileError ||
        !currentProfile
    ) {
        console.error(
            "MESSAGES PROFILE LOAD ERROR:",
            profileError
        )

        redirect("/")
    }

    return (
        <SocialLayout
            profile={
                currentProfile
            }
        >
            <DirectConversationList
                initialConversations={
                    conversations
                }
                currentProfileId={
                    currentProfile.id
                }
            />
        </SocialLayout>
    )
}

export default Page