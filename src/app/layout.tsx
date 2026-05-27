import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteNav } from "@/components/site/nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "InnoLab · 邱懿武的创新实验室",
    template: "%s · InnoLab",
  },
  description:
    "集成 74 个战略、产品、认知方法论的智能分析系统。从认知到产品化的生产引擎。",
  keywords: [
    "创新方法论",
    "战略分析",
    "产品设计",
    "认知升级",
    "邱懿武",
    "InnoLab",
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
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
