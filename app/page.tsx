import { ActivitySection } from "@/components/modules/activity-section"
import { BrandSection } from "@/components/modules/brand-section"
import { MarketSection } from "@/components/modules/market-section"
import { StatisticsSection } from "@/components/modules/statistics-section"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"

const SECTIONS = [
  { id: "brand", title: "品牌定位分析", component: BrandSection },
  { id: "market", title: "商圈调研分析", component: MarketSection },
  { id: "activity", title: "店铺活动方案", component: ActivitySection },
  { id: "statistics", title: "数据统计分析", component: StatisticsSection },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_transparent_38%),linear-gradient(180deg,_#f7f1e6_0%,_#f3ede2_45%,_#efe7d9_100%)]">
      <Header />
      <Toaster />

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[linear-gradient(135deg,_rgba(241,228,208,0.96),_rgba(252,247,239,0.98))] px-6 py-8 shadow-[0_20px_50px_rgba(73,51,29,0.12)] sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-4 py-1.5 text-sm font-medium tracking-[0.2em] text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-700" />
            呈尚策划
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            外卖店铺四件套一页生成台
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            一页填写四份方案，延续旧版老板 UI 的阅读顺序与业务排版。每个模块都支持单独下载，点击下载按钮会先弹出确认层，在桌面端继续弹出保存对话框。
          </p>
        </section>

        <section className="mt-8 space-y-8">
          {SECTIONS.map(({ id, component: Section }) => (
            <div key={id} id={id}>
              <Section />
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
