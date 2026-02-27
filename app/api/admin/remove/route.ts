import { requireAdmin } from "../_auth";
import { readZipMap } from "../_zipmap";
import { commitZipMap } from "@/lib/github";
import { normalizeZip } from "@/lib/zip";

export async function POST(req: Request) {
  requireAdmin(req);

  const body = await req.json();
  const cleanZip = normalizeZip(body.zip);

  if (!cleanZip) {
    return Response.json({ error: "Invalid ZIP" }, { status: 400 });
  }

  const map = readZipMap();

  if (!map[cleanZip]) {
    return Response.json({ error: "ZIP not found" }, { status: 404 });
  }

  delete map[cleanZip];

  await commitZipMap(map);

  return Response.json({ success: true, removed: cleanZip });
}
