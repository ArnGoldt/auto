import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const uploadDir = process.env.UPLOAD_DIR || "./uploads";

export async function saveUpload(file: File, subdir: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(/* turbopackIgnore: true */ process.cwd(), "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const safeName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = path.join(dir, safeName);
  await writeFile(fullPath, bytes);
  return {
    storagePath: path.join(subdir, safeName),
    fileName: file.name,
    mimeType: file.type,
  };
}

export function publicUploadPath(storagePath: string) {
  return `/api/uploads/${storagePath.split(path.sep).join("/")}`;
}
