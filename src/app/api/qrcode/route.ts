import { NextRequest, NextResponse } from "next/server";

// Dynamically import qrcode to gracefully handle missing package during first deploy
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, {
      type:   "image/png",
      width:  300,
      margin: 2,
      color:  { dark: "#1e293b", light: "#ffffff" },
    });
    // dataUrl = "data:image/png;base64,..."
    const base64 = dataUrl.split(",")[1];
    const buf    = Buffer.from(base64, "base64");
    return new Response(buf, {
      headers: {
        "Content-Type":  "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    // qrcode not installed yet — return a placeholder SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f8fafc"/>
      <text x="100" y="90" text-anchor="middle" font-size="11" fill="#94a3b8" font-family="sans-serif">QR code unavailable</text>
      <text x="100" y="110" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="sans-serif">Run npm install</text>
    </svg>`;
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
  }
}
