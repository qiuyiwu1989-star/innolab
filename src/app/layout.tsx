import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteNav } from "@/components/site/nav";
import { CommandMenu } from "@/components/site/command-menu";
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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.qiuyiwu.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "InnoLab — AI 创新战略咨询师",
    template: "%s — InnoLab",
  },
  description:
    "用 74 个方法论分析你的真实商业问题。从认知到产品化，一次完整的战略推演。",
  keywords: [
    "AI 战略咨询",
    "创新方法论",
    "战略分析",
    "产品设计",
    "InnoLab",
    "邱懿武",
  ],
  authors: [{ name: "邱懿武" }],
  openGraph: {
    type: "website",
    siteName: "InnoLab",
    locale: "zh_CN",
  },
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
    >
      <body className="min-h-screen flex flex-col bg-ink text-bone">
        <SiteNav />
        {children}
        <CommandMenu items={searchIndex} />
        {/* Vercel 部署后自动收集，本地无副作用 */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
