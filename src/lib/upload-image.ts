import { compressImageFile } from "./image-compress";

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], "upload", { type: blob.type || "image/webp" });
}

/**
 * Compress in the browser, then store through the upload API. If the API is
 * unavailable (for example a read-only local disk), fall back to the previous
 * data-URL behaviour so the admin can still save the form.
 */
export async function uploadImageFile(file: File): Promise<string> {
  const compressed = await compressImageFile(file);

  try {
    const form = new FormData();
    form.append("file", await dataUrlToFile(compressed));

    const response = await fetch("/api/uploads", { method: "POST", body: form });
    if (!response.ok) return compressed;

    const payload = (await response.json()) as { data?: { url?: unknown } };
    const url = payload.data?.url;
    return typeof url === "string" && url.length > 0 ? url : compressed;
  } catch {
    return compressed;
  }
}
