import FeedSidebar from "@/components/Feed/FeedSidebar"
import GeoLocationSync from "@/components/Geo/GeoLocationSync"
import type { Profile } from "@/types/social"
import type { ReactNode } from "react"

type Props = {
    profile: Profile
    children: ReactNode
}

function SocialLayout({ profile, children }: Props) {
    return (
        <div className="min-h-screen bg-background">
            <GeoLocationSync userId={profile.id} />
            <FeedSidebar profile={profile} />

            <main className="min-w-0 px-0 pb-8 pt-[60] sm:px-4 lg:ml-[220] lg:px-6 lg:pt-4">
                <div className="mx-auto w-full max-w-[760]">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default SocialLayout
