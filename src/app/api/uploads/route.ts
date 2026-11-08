import { randomUUID } from "crypto";
import {
  badRequest,
  created,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";
import { putObject } from "@/lib/storage";
import { extensionForMime, MAX_UPLOAD_BYTES } from "@/lib/validation";

export async function POST(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return badRequest("File is required");
    }
    if (file.size === 0) {
      return badRequest("File is empty");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return badRequest(`File must be at most ${MAX_UPLOAD_BYTES} bytes`);
    }

    const extension = extensionForMime(file.type);
    if (!extension) {
      return badRequest("Unsupported image type");
    }

    const body = new Uint8Array(await file.arrayBuffer());
    const key = `${randomUUID()}.${extension}`;
    const { url } = await putObject({ key, body, contentType: file.type });

    return created({ url });
  } catch (error) {
    return serverError(error, "Failed to upload image");
  }
}
