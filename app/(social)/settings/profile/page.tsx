import DeleteAccountButton from "@/components/Settings/DeleteAccountButton"
import ProfileEditForm from "@/components/Settings/ProfileEditForm"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function Page() {
    const viewer =
        await getCurrentViewer()

    if (!viewer) {
        redirect("/")
    }

    const supabase =
        await createClient()

    const {
        data: profile,
        error
    } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,cover_url,bio,birth_date,location_label,website_url,interests")
        .eq(
            "id",
            viewer.user.id
        )
        .single()

    if (error || !profile) {
        console.error(
            "EDIT PROFILE LOAD ERROR:",
            error
        )

        redirect(
            `/profile/${viewer.profile.username}`
        )
    }

    return (
        <div className="space-y-4">
            <ProfileEditForm
                profile={profile}
            />

            <div className="rounded-3xl bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-[#171717]">
                    Удаление аккаунта
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#888]">
                    Аккаунт и связанные с ним данные будут удалены без возможности восстановления.
                </p>

                <div className="mt-4">
                    <DeleteAccountButton />
                </div>
            </div>
        </div>
    )
}

export default Page