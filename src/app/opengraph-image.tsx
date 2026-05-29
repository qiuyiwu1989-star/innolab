import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InnoLab — AI 创新战略咨询师";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* 大几何 - 右下角圆环 */}
        <div
          style={{
            position: "absolute",
            right: -160,
            bottom: -160,
            width: 520,
            height: 520,
            borderRadius: "50%",
            border: "1px solid rgba(179,255,57,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />

        {/* 顶部品牌行 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 26,
          }}
        >
          <span style={{ fontWeight: 600 }}>InnoLab</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#b3ff39",
              marginLeft: 2,
            }}
          />
          <span style={{ color: "#525252", marginLeft: 8, fontSize: 20 }}>
            v0.1
          </span>
        </div>

        {/* 主标题 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 140,
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#fafafa",
              display: "flex",
            }}
          >
            <span>AI&nbsp;</span>
            <span style={{ color: "#b3ff39" }}>创新</span>
          </div>
          <div
            style={{
              fontSize: 140,
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#fafafa",
            }}
          >
            战略咨询师
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              color: "#a3a3a3",
              maxWidth: 800,
            }}
          >
            用 83 个方法论分析你的真实商业问题
          </div>
        </div>

        {/* 底部数据 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "#a3a3a3",
          }}
        >
          <div style={{ display: "flex", gap: 40 }}>
            <span>
              <b style={{ color: "#fafafa" }}>75</b> 方法
            </span>
            <span>
              <b style={{ color: "#fafafa" }}>6</b> 引擎
            </span>
            <span>
              <b style={{ color: "#fafafa" }}>5</b> 认知层
            </span>
            <span>
              <b style={{ color: "#fafafa" }}>10</b> 案例
            </span>
          </div>
          <div style={{ fontSize: 18, color: "#525252" }}>
            innolab — by 邱懿武
          </div>
        </div>
      </div>
    ),
    size,
  );
}
