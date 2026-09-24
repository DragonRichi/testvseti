import SocialLayout from "@/components/Layout/SocialLayout"

import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import PageBackButton from "@/components/ui/PageBackButton"


type Props = {
    children: ReactNode
}

async function Layout({
    children
}: Props) {
    const viewer =
        await getCurrentViewer()

    if (!viewer) {
        redirect("/")
    }

    return (
        <SocialLayout profile={viewer.profile}>
            <PageBackButton />

            {children}
        </SocialLayout>
    )
}

export default Layout