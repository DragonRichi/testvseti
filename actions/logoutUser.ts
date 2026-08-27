"use server"
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";


export async function logoutUser() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut({
        scope: "local"
    })

    if (error) {
        console.error("LOGOUT ERROR: ", error)
        return ({
            success: false,
            error: "Не удалось выйти из аккаунта"
        })
    }
    redirect("/auth")
}