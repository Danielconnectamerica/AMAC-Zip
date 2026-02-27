export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN || "";
  const got = req.headers.get("x-admin-token") || "";

  if (!expected) return false;
  return got === expected;
}
