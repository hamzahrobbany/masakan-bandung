import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import { uploadImageToBucket } from "@/lib/supabase-server";
import { assertValidUpload, buildUploadPath } from "@/lib/uploads";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: NextRequest) => {
  protectAdminRoute(request);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new ValidationError("File tidak ditemukan", { code: "UPLOAD_FILE_NOT_FOUND" });
  }

  let mime: string;
  try {
    mime = assertValidUpload({ size: file.size, type: file.type });
  } catch (validationError) {
    const message =
      validationError instanceof Error ? validationError.message : "File tidak valid untuk diunggah.";
    throw new ValidationError(message, { code: "UPLOAD_INVALID" });
  }

  const path = buildUploadPath(file.name, mime);
  const { publicUrl } = await uploadImageToBucket({
    filePath: path,
    data: await file.arrayBuffer(),
    contentType: mime,
  });

  return success(
    { url: publicUrl },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
});
