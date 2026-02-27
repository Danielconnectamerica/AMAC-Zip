import { readZipMap } from "../admin/_zipmap";
import { normalizeZip } from "@/lib/zip";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = normalizeZip(searchParams.get("zip") || "");

  if (!zip) return Response.json({ error: "Invalid ZIP" }, { status: 400 });

  const map = readZipMap();

  if (map[zip]) {
    return Response.json({ covered: true, installers: map[zip] });
  }

  return Response.json({ covered: false });
}
