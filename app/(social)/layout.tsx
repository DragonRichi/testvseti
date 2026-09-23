import SocialLayout from "@/components/Layout/SocialLayout"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

type Props = {
    children: ReactNode
}

export default async function SocialRootLayout({ children }: Props) {
    const viewer = await getCurrentViewer()

    if (!viewer) {
        redirect("/")
    }

    return (
        <SocialLayout profile={viewer.profile}>
            {children}
        </SocialLayout>
    )
}
