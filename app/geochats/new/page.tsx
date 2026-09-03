import CreateGeoChatForm from "@/components/GeoChat/CreateGeoChatForm"
import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import type { GeoChatPoint } from "@/types/geoChat"
import { MapPinned } from "lucide-react"
import { redirect } from "next/navigation"

async function Page() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) redirect("/")

    const [{ data: currentProfile, error: profileError }, { data: preciseLocation, error: locationError }] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single(),
        supabase.from("user_precise_locations").select("latitude,longitude").eq("user_id", user.id).maybeSingle()
    ])

    if (profileError || !currentProfile) {
        console.error("CREATE GEO CHAT PROFILE ERROR:", profileError)
        redirect("/")
    }

    if (locationError) {
        console.error("CREATE GEO CHAT LOCATION ERROR:", locationError)
    }

    if (!preciseLocation) {
        redirect("/geochats")
    }

    const initialPoint: GeoChatPoint = {
        latitude: preciseLocation.latitude,
        longitude: preciseLocation.longitude
    }

    return (
        <SocialLayout profile={currentProfile}>
            <div className="mb-4 flex items-center gap-3 px-1">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-main-green">
                    <MapPinned className="size-5" />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-gray-900">Создать геочат</h1>
                    <div className="mt-0.5 text-sm text-main-gray">Выберите место и территорию общения</div>
                </div>
            </div>

            <CreateGeoChatForm initialPoint={initialPoint} />
        </SocialLayout>
    )
}

export default Page