export async function commitZipMap(updatedMap: any) {
  const token = process.env.GITHUB_TOKEN!;
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH!;
  const path = process.env.ZIPMAP_PATH!;

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const getRes = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const current = await getRes.json();

  const content = Buffer.from(
    JSON.stringify(updatedMap, null, 2)
  ).toString("base64");

  await fetch(baseUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update ZIP coverage",
      content,
      sha: current.sha,
      branch
    })
  });
}
