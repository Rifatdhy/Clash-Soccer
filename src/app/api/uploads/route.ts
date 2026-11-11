import { randomUUID } from "crypto";
import {
  badRequest,
  created,
  payloadTooLarge,
  requireAdmin,
  serverError,
} from "@/lib/api-helpers";
import { putObject } from "@/lib/storage";
import {
  declaresOversizedBody,
  identifyImage,
  MAX_UPLOAD_BYTES,
} from "@/lib/validation";

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  // `formData()` buffers the entire body before any field is inspected, so an
  // oversized upload has to be refused from the header. The file size check
  // below still runs: the header can be absent or lie.
  if (declaresOversizedBody(request.headers.get("content-length"))) {
    return payloadTooLarge(`File must be at most ${MAX_UPLOAD_BYTES} bytes`);
  }

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
      return payloadTooLarge(`File must be at most ${MAX_UPLOAD_BYTES} bytes`);
    }

    // The extension and the stored content type both come from the bytes, not
    // from `file.type`. A client can claim `image/png` for an HTML or SVG
    // payload; sniffing means the filename can never disagree with the content.
    const body = new Uint8Array(await file.arrayBuffer());
    const image = identifyImage(body);
    if (!image) {
      return badRequest("File is not a supported image");
    }

    const key = `${randomUUID()}.${image.extension}`;
    const { url } = await putObject({
      key,
      body,
      contentType: image.mime,
    });

    return created({ url });
  } catch (error) {
    return serverError(error, "Failed to upload image");
  }
}
