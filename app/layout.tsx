import type { Metadata, Viewport } from "next"
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "呈尚策划 - 外卖店铺四件套",
  description: "一站式外卖店铺策划方案生成平台，包含品牌定位、商圈调研、活动方案、数据统计四大模块",
  keywords: ["外卖", "店铺策划", "品牌定位", "商圈调研", "活动方案", "数据统计"],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
