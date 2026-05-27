import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon
export default function AppleIcon() {
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
          fontSize: 120,
          letterSpacing: "-0.05em",
          position: "relative",
        }}
      >
        I
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 28,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#b3ff39",
          }}
        />
      </div>
    ),
    size,
  );
}
