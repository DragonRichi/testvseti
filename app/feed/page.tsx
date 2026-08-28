import FeedHeader from "@/components/Feed/FeedHeader"
import FeedRightSidebar from "@/components/Feed/FeedRightSidebar"
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
            <div className="mx-auto grid min-h-screen w-full max-w-[1550] lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">
                <FeedSidebar profile={profile} />
                <main className="min-w-0 px-4 pb-4 pt-20 sm:px-6 lg:px-8 lg:pt-4">
                    <FeedHeader />

                    <div className="flex min-h-[400] items-center justify-center rounded-2xl border border-green-100 bg-white text-main-gray">
                        Здесь будет лента
                    </div>
                </main>
                <aside className="hidden border-l border-green-100 bg-[#fbfdfb] xl:block">
                    <FeedRightSidebar />
                </aside>
            </div>
        </div>
    )
}

export default page
