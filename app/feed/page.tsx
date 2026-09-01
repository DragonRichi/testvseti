import FeedHeader from "@/components/Feed/FeedHeader"
import FeedSidebar from "@/components/Feed/FeedSidebar"
import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function page() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: profile, error } = await supabase.from("profiles").select(`id,username,display_name,avatar_url`).eq("id", user.id).single()
    console.log("profile ==> ", profile);

    if (error || !profile) {
        console.error("PROFILE LOAD ERROR: ", error)
        redirect("/")
    }

    return (

        <SocialLayout profile={profile}>
            <FeedSidebar profile={profile} />
            <main className="min-w-0 px-4 pb-4 pt-20 sm:px-6 lg:pt-4">
                <div className="mx-auto w-full max-w-[800]">
                    <FeedHeader profile={profile} />

                    <div className="flex min-h-[400] items-center justify-center rounded-2xl border border-green-100 bg-white text-main-gray">
                        Здесь будет лента
                    </div>
                </div>
            </main>
        </SocialLayout>

    )
}

export default page
