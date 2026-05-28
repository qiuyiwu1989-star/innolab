"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * next-themes 包裹层。
 * - attribute="class" 让它在 <html> 上挂 .light / .dark
 * - defaultTheme="dark" InnoLab 默认暗色
 * - enableSystem 让"跟随系统"成为选项
 * - disableTransitionOnChange 切主题时短暂禁过渡，避免闪烁
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="innolab-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
