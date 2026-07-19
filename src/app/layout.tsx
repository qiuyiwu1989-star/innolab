import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { CommandMenu } from "@/components/site/command-menu";
import { ThemeProvider } from "@/components/site/theme-provider";
import { getSearchIndex } from "@/lib/search";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.cc";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "InnoLab — 把战略难题，想透 | 邱懿武",
    template: "%s — InnoLab",
  },
  description:
    "邱懿武的方法论 × AI 推演引擎。86 个方法、76 个真实案例，把模糊的商业难题切准、推演、给出下一步。先免费体验，需要时找他本人做 1:1 战略咨询。",
  keywords: [
    "AI 战略咨询",
    "创新方法论",
    "战略分析",
    "产品设计",
    "认知升级",
    "AI 转型",
    "InnoLab",
    "邱懿武",
    "蓝海战略",
    "第一性原理",
    "范式转移",
  ],
  authors: [{ name: "邱懿武", url: "https://qiuyiwu.com" }],
  creator: "邱懿武",
  publisher: "InnoLab",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "InnoLab",
    locale: "zh_CN",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "InnoLab — 把战略难题，想透 | 邱懿武",
    description: "邱懿武的方法论 × AI 推演引擎。86 方法 + 76 案例，先免费体验，需要时找他本人。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchIndex = getSearchIndex();
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${notoSC.variable} ${jetbrains.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-ink text-bone">
        <ThemeProvider>
          <SiteNav />
          {children}
          <SiteFooter />
          <CommandMenu items={searchIndex} />
        </ThemeProvider>
        {/* Vercel 部署后自动收集，本地无副作用 */}
        <Analytics />
        <SpeedInsights />
        {/* 百度统计 —— 看真人流量（PV/UV/来源/搜索词），补上"机器在抓但看不到真人"的盲区 */}
        <Script id="baidu-tongji" strategy="afterInteractive">
          {`
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?2d02e198a4abaa8ac3b0a97aacd10186";
              var s = document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(hm, s);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
