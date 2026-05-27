import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// 动态 favicon：黑底 + "I" + volt 点
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.05em",
          position: "relative",
        }}
      >
        I
        <div
          style={{
            position: "absolute",
            right: 5,
            top: 5,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#b3ff39",
          }}
        />
      </div>
    ),
    size,
  );
}
