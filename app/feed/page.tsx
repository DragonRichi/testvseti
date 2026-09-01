import FeedHeader from "@/components/Feed/FeedHeader"
import FeedSidebar from "@/components/Feed/FeedSidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function page() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/")

    const { data: profile, error } = await supabase.from("profiles").select(`id,username,display_name,avatar_url`).eq("id", user.id).single()
    console.log("profile ==> ", profile);

    if (error) {
        console.error("PROFILE LOAD ERROR: ", error)
    }

    return (
        <div className="min-h-screen bg-[#f7faf7]">
            <div className="mx-auto grid min-h-screen w-full max-w-[1050] lg:grid-cols-[250px_minmax(0,800px)]">
                <FeedSidebar profile={profile} />
                <main className="min-w-0 px-4 pb-4 pt-20 sm:px-6 lg:pt-4">
                    <div className="mx-auto w-full max-w-[800]">
                        <FeedHeader />

                        <div className="flex min-h-[400] items-center justify-center rounded-2xl border border-green-100 bg-white text-main-gray">
                            Здесь будет лента
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default page
