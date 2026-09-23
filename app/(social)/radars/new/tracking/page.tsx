import CreateTrackingRadar from "@/components/Radar/CreateTrackingRadar"
import RadarTypeSwitch from "@/components/Radar/RadarTypeSwitch"

function Page() {
    return (
        <div className="flex flex-col gap-4">
            <RadarTypeSwitch active="tracking" />

            <CreateTrackingRadar />
        </div>
    )
}

export default Page
