import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import NavigationBlur from "@/components/ui/NavigationBlur"
import { Suspense } from "react"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap"
})

export const metadata: Metadata = {
  title: "ВСети",
  description: "Геолокационная социальная сеть",
  icons: {
    icon: "/logo.svg"
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Suspense fallback={null}>
          <NavigationBlur />
        </Suspense>
      </body>
    </html>
  )
}