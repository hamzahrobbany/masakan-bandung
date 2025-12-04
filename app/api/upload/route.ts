import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import { uploadImageToBucket } from "@/lib/supabase-server";
import { assertValidUpload, buildUploadPath } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { response } = protectAdminRoute(request);
  if (response) return response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    let mime: string;
    try {
      mime = assertValidUpload({ size: file.size, type: file.type });
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : "File tidak valid untuk diunggah.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const path = buildUploadPath(file.name, mime);
    const { publicUrl } = await uploadImageToBucket({
      filePath: path,
      data: await file.arrayBuffer(),
      contentType: mime,
    });

    return NextResponse.json({ url: publicUrl }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah gambar" }, { status: 500 });
  }
}
