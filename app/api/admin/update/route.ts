import { requireAdmin } from "../_auth";
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
    throw new Error(`Failed to read zipmap.json from GitHub: ${t}`);
  }

  const payload: any = await res.json();
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  const data = JSON.parse(decoded) as Record<string, string[]>;

  return data;
}

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
  try {
    requireAdmin(req);

    const body = await req.json();

    const cleanZip = normalizeZip(String(body.zip || ""));
    if (!cleanZip) {
      return Response.json(
        { error: "Invalid ZIP. Use 5 digits or ZIP+4." },
        { status: 400 }
      );
    }

    const installers = normalizeInstallers(body.installers);

    if (installers.length === 0) {
      return Response.json(
        { error: "Installers required (at least 1). Use comma-separated names." },
        { status: 400 }
      );
    }

    // Always pull latest from GitHub so we don't overwrite with stale data
    const map = await fetchZipMapFromGitHub();

    // Replace installers (true update)
    map[cleanZip] = Array.from(new Set(installers)); // de-dupe just in case

    await commitZipMap(map);

    return Response.json({
      success: true,
      zip: cleanZip,
      installers: map[cleanZip],
    });
  } catch (err: any) {
    return Response.json(
      { error: "Update failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
