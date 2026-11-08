import { readFile } from "fs/promises";
import { join, resolve, sep } from "path";
import { NextResponse } from "next/server";
import { notFound } from "@/lib/api-helpers";
import { resolveStorageDriver } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (resolveStorageDriver() !== "local") {
    return notFound("Upload not found");
  }

  const { path } = await params;
  const uploadDir = resolve(process.env.UPLOAD_DIR?.trim() || join(process.cwd(), ".data", "uploads"));
  const target = resolve(uploadDir, ...path);

  if (target !== uploadDir && !target.startsWith(`${uploadDir}${sep}`)) {
    return notFound("Upload not found");
  }

  const extension = target.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return notFound("Upload not found");
  }

  try {
    const file = await readFile(target);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound("Upload not found");
  }
}
