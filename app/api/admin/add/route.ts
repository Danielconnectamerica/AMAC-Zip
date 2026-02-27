import { isAdmin } from "../_auth";
import { commitZipMap } from "@/lib/github";
import { normalizeZip } from "@/lib/zip";

async function fetchZipMapFromGitHub(): Promise<Record<string, string[]>> {
  const token = process.env.GITHUB_TOKEN!;
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.ZIPMAP_PATH || "data/zipmap.json";

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub read failed: ${t}`);
  }

  const payload: any = await res.json();
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  return JSON.parse(decoded) as Record<string, string[]>;
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) {
      return Response.json({ error: "Unauthorized (bad token or ADMIN_TOKEN missing)" }, { status: 401 });
    }

    const body = await req.json();
    const cleanZip = normalizeZip(String(body.zip || ""));
    if (!cleanZip) {
      return Response.json({ error: "Invalid ZIP. Use 5 digits or ZIP+4." }, { status: 400 });
    }

    const installers = Array.isArray(body.installers)
      ? body.installers.map((x: any) => String(x).trim()).filter(Boolean)
      : [];

    if (installers.length === 0) {
      return Response.json({ error: "Installers required" }, { status: 400 });
    }

    const map = await fetchZipMapFromGitHub();

    if (!map[cleanZip]) map[cleanZip] = [];
    for (const i of installers) {
      if (!map[cleanZip].includes(i)) map[cleanZip].push(i);
    }

    await commitZipMap(map);

    return Response.json({ success: true, zip: cleanZip, installers: map[cleanZip] });
  } catch (err: any) {
    return Response.json(
      { error: "Add failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
