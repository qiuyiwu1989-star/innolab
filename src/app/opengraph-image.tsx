import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InnoLab · 邱懿武的创新实验室";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fafaf9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* 几何装饰 */}
        <div
          style={{
            position: "absolute",
            right: -200,
            top: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(45,91,255,0.10)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -150,
            bottom: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(255,107,53,0.10)",
            filter: "blur(40px)",
          }}
        />

        {/* 顶部 chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid #e7e5e4",
            background: "rgba(255,255,255,0.7)",
            width: "fit-content",
            fontSize: 22,
            color: "#0a0a0a",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background:
                "linear-gradient(135deg, #2D5BFF 0%, #8B5CF6 50%, #FF6B35 100%)",
            }}
          />
          <span style={{ fontWeight: 600 }}>InnoLab</span>
          <span style={{ color: "#a8a29e" }}>· 邱懿武的创新实验室</span>
        </div>

        {/* 主标题 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 110,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#0a0a0a",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>从</span>
            <span style={{ color: "#2D5BFF" }}>认知</span>
            <span>到</span>
            <span style={{ color: "#FF6B35" }}>产品化</span>
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 42,
              fontWeight: 600,
              color: "#0a0a0a",
            }}
          >
            的生产系统
          </div>
        </div>

        {/* 底部数据 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: "#57534e",
          }}
        >
          <div style={{ display: "flex", gap: 32 }}>
            <span>
              <b style={{ color: "#0a0a0a" }}>74</b> 方法
            </span>
            <span>
              <b style={{ color: "#0a0a0a" }}>6</b> 引擎
            </span>
            <span>
              <b style={{ color: "#0a0a0a" }}>5</b> 层认知
            </span>
            <span>
              <b style={{ color: "#0a0a0a" }}>10</b> 案例
            </span>
          </div>
          <div style={{ fontSize: 20, color: "#a8a29e" }}>v0.1</div>
        </div>
      </div>
    ),
    size,
  );
}
