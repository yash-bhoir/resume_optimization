import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function parseSize(value: string | null): number {
  const n = Number(value);
  if (n === 192 || n === 512) return n;
  return 192;
}

export async function GET(request: NextRequest) {
  const size = parseSize(request.nextUrl.searchParams.get("size"));
  const fontSize = Math.round(size * 0.42);
  const radius = Math.round(size * 0.2);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2A6B4F",
          borderRadius: radius,
          color: "white",
          fontSize,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        R
      </div>
    ),
    { width: size, height: size }
  );
}
