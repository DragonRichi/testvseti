import { logoutUser } from "@/actions/logoutUser"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function page() {
    const supabase = await createClient()

    const { data } = await supabase.auth.getClaims()

    if (!data?.claims) {
        redirect("/auth")
    }

    return (
        <div>
            Главная страница vseti.by
            <div>
                Вы авторизованы как {String(data.claims.email ?? "")}
            </div>
            <button onClick={logoutUser} type="submit">Выйти из аккаунта</button>
        </div>
    )
}

export default page
