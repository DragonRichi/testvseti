import DeleteAccountButton from "@/components/Settings/DeleteAccountButton"

function page() {
    return (
        <div className="mt-8 rounded-2xl border border-red-100 bg-white p-5">
            <h2 className="text-base font-bold text-gray-900">
                Удаление аккаунта
            </h2>

            <p className="mt-2 text-sm leading-6 text-main-gray">
                Аккаунт и связанные с ним данные будут удалены без возможности восстановления.
            </p>

            <div className="mt-4">
                <DeleteAccountButton />
            </div>
        </div>
    )
}

export default page
