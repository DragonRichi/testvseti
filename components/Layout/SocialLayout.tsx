import FeedSidebar from "@/components/Feed/FeedSidebar"
import type { Profile } from "@/types/social"
import type { ReactNode } from "react"
import GeoLocationSync from "../Geo/GeoLocationSync"

type Props = {
    profile: Profile
    children: ReactNode
}

function SocialLayout({ profile, children }: Props) {
    return (
        <div className="min-h-screen bg-[#f7faf7]">
            <GeoLocationSync />
            <div className="mx-auto grid min-h-screen w-full max-w-[1070] lg:grid-cols-[250px_minmax(0,800px)] lg:gap-5">
                <FeedSidebar profile={profile} />

                <main className="min-w-0 px-4 pb-10 pt-20 sm:px-6 lg:px-0 lg:pt-4">
                    <div className="mx-auto w-full max-w-[800]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default SocialLayout