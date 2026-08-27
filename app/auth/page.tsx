import Authorizate from "@/components/Authorizate/Authorizate"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Auth() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()

    if (data?.claims) {
        redirect("/feed")
    }

    return (
        <Authorizate />
    )
}

export default Auth
