import { MapPin, UsersRound } from "lucide-react"
import Link from "next/link"

type Props = {
    active: "publications" | "tracking"
}

function RadarTypeSwitch({ active }: Props) {
    return (
        <div className="grid grid-cols-2 rounded-2xl border border-green-100 bg-white p-1">
            <Link href="/radars/new" className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${active === "publications" ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-gray-50 hover:text-gray-900"}`}>
                <UsersRound className="size-4" />
                Публикации
            </Link>

            <Link href="/radars/new/tracking" className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${active === "tracking" ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-gray-50 hover:text-gray-900"}`}>
                <MapPin className="size-4" />
                Слежение
            </Link>
        </div>
    )
}

export default RadarTypeSwitch