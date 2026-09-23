import GeoChatLocationGate from "@/components/GeoChat/GeoChatLocationGate"
import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"

async function Page() {
    const initialAdminMode = await hasGeoChatAdminMode()

    return (
        <GeoChatLocationGate initialAdminMode={initialAdminMode} />
    )
}

export default Page
