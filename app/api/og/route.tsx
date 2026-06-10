import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = (searchParams.get("title") ?? "Resume Fit").slice(0, 120);
  const description = (
    searchParams.get("description") ??
    "Free ATS resume checker — optimize resume for job description"
  ).slice(0, 200);
  const type = searchParams.get("type") ?? "default";

  const accent =
    type === "howto" ? "#1F523D" : type === "blog" ? "#2A6B4F" : "#2A6B4F";

  const image = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, #14151A 0%, ${accent} 100%)`,
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#2A6B4F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            RF
          </div>
          <span style={{ color: "#E8F2ED", fontSize: 22, fontWeight: 600 }}>
            Resume Fit
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: title.length > 50 ? 48 : 56,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#C8D9D0",
              lineHeight: 1.4,
              maxWidth: "90%",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#A8D4BC", fontSize: 20 }}>
            Free ATS Resume Checker · Resume Optimizer
          </span>
          <span style={{ color: "#63656E", fontSize: 18 }}>resumefit.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  image.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return image;
}
