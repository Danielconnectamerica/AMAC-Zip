export function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}
