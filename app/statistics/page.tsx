import { StatisticsSection } from "@/components/modules/statistics-section"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      <Toaster />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <StatisticsSection />
      </main>
    </div>
  )
}
