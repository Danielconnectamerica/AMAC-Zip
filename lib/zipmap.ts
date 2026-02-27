let cache: { at: number; data: Record<string, string[]> } | null = null;

export async function fetchZipMap(): Promise<Record<string, string[]>> {
  const now = Date.now();
  if (cache && now - cache.at < 30_000) return cache.data; // 30s cache

  const token = process.env.GITHUB_TOKEN!;
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH!;
  const path = process.env.ZIPMAP_PATH!;

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
    throw new Error(`Failed to fetch zipmap from GitHub: ${t}`);
  }

  const json = await res.json();
  const decoded = Buffer.from(json.content as string, "base64").toString("utf8");
  const data = JSON.parse(decoded) as Record<string, string[]>;

  cache = { at: now, data };
  return data;
}
