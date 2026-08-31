import FeedSidebar from "@/components/Feed/FeedSidebar"
import ProfileHeader from "@/components/Profile/ProfileHeader"
import ProfileRightSidebar from "@/components/Profile/ProfileRightSidebar"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

type Props = {
    params: Promise<{ username: string }>
}

async function Page({ params }: Props) {

    const { username } = await params

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (currentProfileError) {
        console.error("CURRENT PROFILE LOAD ERROR: ", currentProfileError)
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url,cover_url,bio,birth_date,location_label,website_url,subscriber_count,is_verified,badge_title,interests").eq("username", username.toLowerCase()).single()

    if (profileError || !profile) {
        console.error("PROFILE LOAD ERROR: ", profileError)
        notFound()
    }

    const isOwnProfile = user.id === profile.id

    return (
        <div className="min-h-screen bg-[#f7faf7]">
            <div className="mx-auto grid min-h-screen w-full max-w-[1550] lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">
                <FeedSidebar profile={currentProfile} />
                <main className="min-w-0 px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-4">
                    <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
                    <div className="mt-4 min-h-[500] rounded-2xl border border-green-100 bg-white">
                        <div className="flex h-[300] items-center justify-center text-main-gray">
                            Здесь будут публикации
                        </div>
                    </div>
                </main>
                <aside className="hidden border-l border-green-100 bg-[#fbfdfb] xl:block">
                    <ProfileRightSidebar profile={profile} />

                </aside>
            </div>
        </div>
    )
}

export default Page
