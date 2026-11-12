import { compressImageFile } from "./image-compress";

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], "upload", { type: blob.type || "image/webp" });
}

/**
 * Compress in the browser, then store through the upload API.
 *
 * There is no data-URL fallback: a base64 image saved into a JSON body is
 * invisible to storage cleanup, inflates every read of the row, and hides the
 * real failure from the admin. If the upload cannot complete, the promise
 * rejects and the form shows the error.
 */
export async function uploadImageFile(file: File): Promise<string> {
  const compressed = await compressImageFile(file);

  let response: Response;
  try {
    const form = new FormData();
    form.append("file", await dataUrlToFile(compressed));
    response = await fetch("/api/uploads", { method: "POST", body: form });
  } catch {
    throw new Error("Upload gambar gagal. Periksa koneksi lalu coba lagi.");
  }

  if (!response.ok) {
    throw new Error("Upload gambar gagal. Coba lagi.");
  }

  const payload = (await response.json()) as { data?: { url?: unknown } };
  const url = payload.data?.url;
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("Upload gambar gagal. Server tidak mengembalikan URL.");
  }

  return url;
}
