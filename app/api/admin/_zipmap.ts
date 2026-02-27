import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "zipmap.json");

export function readZipMap() {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
