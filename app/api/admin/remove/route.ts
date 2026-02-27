import { requireAdmin } from "../_auth";
import { commitZipMap } from "@/lib/github";
import { normalizeZip } from "@/lib/zip";

let cache: { at: number; data: Record<string, string[]>; sha?: string } | null = null;

async function fetchZipMapFromGitHub() {
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
    throw new Error(`Failed to read zipmap.json from GitHub: ${t}`);
  }

  const payload: any = await res.json();
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  const data = JSON.parse(decoded) as Record<string, string[]>;

  return { data, sha: payload.sha as string };
}

export async function POST(req: Request) {
  try {
    requireAdmin(req);

    const body = await req.json();
    const cleanZip = normalizeZip(String(body.zip || ""));

    if (!cleanZip) {
      return Response.json({ error: "Invalid ZIP. Use 5 digits or ZIP+4." }, { status: 400 });
    }

    // Always pull latest from GitHub so we delete the correct key
    const { data: map } = await fetchZipMapFromGitHub();

    if (!map[cleanZip]) {
      return Response.json({ error: `ZIP ${cleanZip} not found` }, { status: 404 });
    }

    delete map[cleanZip];

    await commitZipMap(map);

    return Response.json({ success: true, removed: cleanZip });
  } catch (err: any) {
    return Response.json(
      { error: "Remove failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
