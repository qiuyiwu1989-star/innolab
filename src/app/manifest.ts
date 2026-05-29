import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InnoLab — 把战略难题，想透",
    short_name: "InnoLab",
    description:
      "邱懿武的方法论 × AI 推演引擎。83 方法 + 76 案例，把模糊的商业难题切准、推演、给出下一步。",
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
