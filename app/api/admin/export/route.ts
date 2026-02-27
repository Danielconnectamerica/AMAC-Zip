import { isAdmin } from "../_auth";

type ZipMap = Record<string, string[]>;

async function fetchZipMapFromGitHub(): Promise<ZipMap> {
  const token = process.env.GITHUB_TOKEN as string;
  const owner = process.env.GITHUB_OWNER as string;
  const repo = process.env.GITHUB_REPO as string;
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
    const text = await res.text();
    throw new Error(`GitHub read failed: ${text}`);
  }

  const payload = await res.json();
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  return JSON.parse(decoded) as ZipMap;
}

function csvEscape(value: string) {
  // Wrap in quotes if it contains commas/quotes/newlines
  const needs = /[",\n]/.test(value);
  const v = value.replace(/"/g, '""');
  return needs ? `"${v}"` : v;
}

export async function GET(req: Request) {
  try {
    if (!isAdmin(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const map = await fetchZipMapFromGitHub();

    // CSV format: zip,installers (installers joined by " | ")
    const lines: string[] = [];
    lines.push("zip,installers");

    const zips = Object.keys(map).sort();
    for (const zip of zips) {
      const installers = (map[zip] || []).join(" | ");
      lines.push(`${csvEscape(zip)},${csvEscape(installers)}`);
    }

    const csv = lines.join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="zip-installers.csv"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Export failed", details: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
