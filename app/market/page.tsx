import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { MarketSection } from "@/components/modules/market-section"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      <Toaster />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Button variant="ghost" className="rounded-full px-0 text-muted-foreground hover:bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回一页四表单首页
            </Button>
          </Link>
        </div>
        <MarketSection />
      </main>
    </div>
  )
}
