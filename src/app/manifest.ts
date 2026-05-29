import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InnoLab — AI 创新战略咨询师",
    short_name: "InnoLab",
    description:
      "用 79 个方法论分析你的真实商业问题。从认知到产品化，一次完整的战略推演。",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#b3ff39",
    orientation: "portrait",
    lang: "zh-CN",
    categories: ["business", "productivity", "education"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
