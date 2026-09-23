import CreateGeoChatForm from "@/components/GeoChat/CreateGeoChatForm"
import { MapPinned } from "lucide-react"

function Page() {
    return (
        <>
            <div className="mb-4 flex items-center gap-3 px-1">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-main-green">
                    <MapPinned className="size-5" />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Создать геочат
                    </h1>

                    <div className="mt-0.5 text-sm text-main-gray">
                        Центр определяется автоматически по вашему местоположению
                    </div>
                </div>
            </div>

            <CreateGeoChatForm />
        </>
    )
}

export default Page
