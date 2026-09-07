import { LoaderCircle } from "lucide-react"

function Loading() {
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/45 backdrop-blur-[3px]">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/90 shadow-lg ring-1 ring-black/5">
                <LoaderCircle className="size-7 animate-spin text-main-green" />
            </div>
        </div>
    )
}

export default Loading