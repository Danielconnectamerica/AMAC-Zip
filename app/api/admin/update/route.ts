import { isAdmin } from "../_auth";
import { commitZipMap } from "@/lib/github";
import { normalizeZip } from "@/lib/zip";

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
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub read failed: ${text}`);
  }

  const payload = await res.json();
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");

  return JSON.parse(decoded) as ZipMap;
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await req.json();

    const cleanZip = normalizeZip(String(body.zip || ""));
    if (!cleanZip) {
      return new Response(
        JSON.stringify({ error: "Invalid ZIP format" }),
        { status: 400 }
      );
    }

    const installersInput = body.installers;

    let installers: string[] = [];

    if (Array.isArray(installersInput)) {
      installers = installersInput
        .map((x) => String(x).trim())
        .filter(Boolean);
    }

    if (installers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Installers required" }),
        { status: 400 }
      );
    }

    const map = await fetchZipMapFromGitHub();

    // Replace installer list
    map[cleanZip] = Array.from(new Set(installers));

    await commitZipMap(map);

    return new Response(
      JSON.stringify({
        success: true,
        zip: cleanZip,
        installers: map[cleanZip],
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Update failed",
        details: err?.message || String(err),
      }),
      { status: 500 }
    );
  }
}
