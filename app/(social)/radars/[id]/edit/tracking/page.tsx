import EditTrackingRadar from "@/components/Radar/EditTrackingRadar"
import { getTrackingRadarForEdit } from "@/lib/radars/getTrackingRadarForEdit"
import { notFound } from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

async function Page({ params }: Props) {
    const { id } = await params
    const radar = await getTrackingRadarForEdit(id)

    if (!radar) notFound()

    return (
        <EditTrackingRadar radar={radar} />
    )
}

export default Page
