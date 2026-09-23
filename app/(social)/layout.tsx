import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

type Props = {
    children: ReactNode
}

export default async function SocialRootLayout({
    children
}: Props) {
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

    const {
        data: profile,
        error
    } =
        await supabase
            .from("profiles")
            .select(
                "id, username, display_name, avatar_url"
            )
            .eq(
                "id",
                user.id
            )
            .single()

    if (
        error ||
        !profile
    ) {
        redirect("/")
    }

    return (
        <SocialLayout
            profile={profile}
        >
            {children}
        </SocialLayout>
    )
}