import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import { uploadImageToBucket } from "@/lib/supabase-server";
import { assertValidUpload, buildUploadPath } from "@/lib/uploads";
import { error, success } from "@/utils/response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { response } = protectAdminRoute(request);
  if (response) return response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return error("UPLOAD_FILE_NOT_FOUND", "File tidak ditemukan", { status: 400 });
    }

    let mime: string;
    try {
      mime = assertValidUpload({ size: file.size, type: file.type });
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : "File tidak valid untuk diunggah.";
      return error("UPLOAD_INVALID", message, { status: 400 });
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
  } catch (error) {
    console.error("Upload error:", error);
    return error("UPLOAD_FAILED", "Gagal mengunggah gambar", { status: 500 });
  }
}
