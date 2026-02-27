import { normalizeZip } from "@/lib/zip";

let cache: { at: number; data: Record<string, string[]> } | null = null;

async function fetchZipMap(): Promise<Record<string, string[]>> {
  // Small cache to reduce GitHub API calls (30 seconds)
  const now = Date.now();
  if (cache && now - cache.at < 30_000) return cache.data;

  const token = process.env.GITHUB_TOKEN!;
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.ZIPMAP_PATH || "data/zipmap.json";

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to fetch zipmap.json from GitHub: ${t}`);
  }

  const payload: any = await res.json();

  // GitHub "contents" API returns base64
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  const data = JSON.parse(decoded) as Record<string, string[]>;

  cache = { at: now, data };
  return data;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zip = normalizeZip(searchParams.get("zip") || "");

    if (!zip) {
      return Response.json({ error: "Invalid ZIP" }, { status: 400 });
    }

    const map = await fetchZipMap();

    if (map[zip]) {
      return Response.json({ covered: true, installers: map[zip] });
    }

    return Response.json({ covered: false });
  } catch (err: any) {
    return Response.json(
      { error: "Lookup failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
