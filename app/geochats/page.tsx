import GeoChatLocationGate from "@/components/Geo/GeoChatLocationGate"
import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import { MapPinned } from "lucide-react"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) redirect("/")

    const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (currentProfileError || !currentProfile) {
        console.error("GEOCHATS CURRENT PROFILE LOAD ERROR:", currentProfileError)
        redirect("/")
    }

    const { data: testAccess, error: testAccessError } = await supabase.rpc("has_geo_chat_test_access")

    if (testAccessError) {
        console.error("GEO CHAT TEST ACCESS LOAD ERROR:", testAccessError)
    }

    return (
        <SocialLayout profile={currentProfile}>
            <div className="mb-4 flex items-center gap-3 px-1">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-main-green">
                    <MapPinned className="size-5" />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-gray-900">Геочаты</h1>
                    <div className="mt-0.5 text-sm text-main-gray">Общайтесь с людьми рядом</div>
                </div>
            </div>

            <GeoChatLocationGate initialTestAccess={Boolean(testAccess)} />
        </SocialLayout>
    )
}

export default Page