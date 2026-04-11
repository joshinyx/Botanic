import type { APIRoute } from "astro";
import { generateQRDataURL, generateQRSVG } from "@/lib/qr";
import { createSupabaseServerClient } from "@/lib/supabase";

const ALLOWED_FORMATS = ["png", "svg"] as const;
type QRFormat = typeof ALLOWED_FORMATS[number];

export const GET: APIRoute = async ({ params, url, request, cookies }) => {
  const id = params.id;
  if (!id) return new Response("Not found", { status: 404 });

  // Validate id is a UUID
  if (!/^[0-9a-f-]{36}$/.test(id))
    return new Response("Not found", { status: 404 });

  // Verify plant exists and is approved
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: plant } = await supabase
    .from("plants")
    .select("id, name, status")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!plant) return new Response("Not found", { status: 404 });

  // Whitelist format — reject anything not png/svg
  const rawFormat = url.searchParams.get("format") ?? "png";
  if (!ALLOWED_FORMATS.includes(rawFormat as QRFormat)) {
    return new Response("Invalid format", { status: 400 });
  }
  const format = rawFormat as QRFormat;

  const baseUrl = import.meta.env.PUBLIC_BASE_URL;

  if (format === "svg") {
    const svg = await generateQRSVG(id, baseUrl);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${id}-qr.svg"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const dataUrl = await generateQRDataURL(id, baseUrl);
  const base64 = dataUrl.split(",")[1];
  if (!base64) return new Response("Failed to generate QR", { status: 500 });

  const buffer = Buffer.from(base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${id}-qr.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
};
