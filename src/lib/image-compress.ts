/**
 * Browser-side image compression for admin uploads.
 *
 * Phone photos are commonly 4-8 MB. Resizing them before they become a data
 * URL keeps the request small, while the API still enforces a hard cap.
 */

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("File gambar tidak valid."));
    image.src = src;
  });
}

export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Ukuran file maksimal 10MB.");
  }

  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Browser tidak mendukung kompresi gambar.");
  }

  context.drawImage(image, 0, 0, width, height);

  const webp = canvas.toDataURL("image/webp", QUALITY);
  if (webp.startsWith("data:image/webp")) return webp;

  return canvas.toDataURL("image/jpeg", QUALITY);
}
