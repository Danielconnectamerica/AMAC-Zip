import { requireAdmin } from "../_auth";
import { readZipMap } from "../_zipmap";
import { commitZipMap } from "@/lib/github";
import { normalizeZip } from "@/lib/zip";

export async function POST(req: Request) {
  requireAdmin(req);
  const { zip, installers } = await req.json();

  const cleanZip = normalizeZip(zip);
  if (!cleanZip) return Response.json({ error: "Invalid ZIP" }, { status: 400 });

  const map = readZipMap();

  if (!map[cleanZip]) map[cleanZip] = [];

  installers.forEach((i: string) => {
    if (!map[cleanZip].includes(i)) {
      map[cleanZip].push(i);
    }
  });

  await commitZipMap(map);

  return Response.json({ success: true });
}
