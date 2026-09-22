import CreateGeoChatForm from "@/components/GeoChat/CreateGeoChatForm"
import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import { MapPinned } from "lucide-react"
import { redirect } from "next/navigation"

async function Page() {
    const supabase =
        await createClient()

    const {
        data: {
            user
        },
        error:
        userError
    } =
        await supabase.auth.getUser()

    if (
        userError ||
        !user
    ) {
        redirect("/")
    }

    const {
        data: currentProfile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select(
            "id,username,display_name,avatar_url"
        )
        .eq(
            "id",
            user.id
        )
        .single()

    if (
        profileError ||
        !currentProfile
    ) {
        console.error(
            "CREATE GEO CHAT PROFILE ERROR:",
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
            <div className="mb-4 flex items-center gap-3 px-1">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-main-green">
                    <MapPinned className="size-5" />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Создать геочат
                    </h1>

                    <div className="mt-0.5 text-sm text-main-gray">
                        Центр определяется автоматически по вашему местоположению
                    </div>
                </div>
            </div>

            <CreateGeoChatForm />
        </SocialLayout>
    )
}

export default Page