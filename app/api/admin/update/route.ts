import { requireAdmin } from "../_auth";
import { readZipMap } from "../_zipmap";
import { commitZipMap } from "@/lib/github";
import { normalizeZip } from "@/lib/zip";

function normalizeInstallers(input: unknown): string[] {
  // Accept array OR comma-separated string
  if (Array.isArray(input)) {
    return input
      .map((x) => String(x).trim())
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function POST(req: Request) {
  requireAdmin(req);

  const body = await req.json();
  const cleanZip = normalizeZip(body.zip);

  if (!cleanZip) {
    return Response.json({ error: "Invalid ZIP" }, { status: 400 });
  }

  const installers = normalizeInstallers(body.installers);
  if (installers.length === 0) {
    return Response.json(
      { error: "Installers required (at least 1)" },
      { status: 400 }
    );
  }

  const map = readZipMap();
  map[cleanZip] = installers;

  await commitZipMap(map);

  return Response.json({ success: true, zip: cleanZip, installers });
}
