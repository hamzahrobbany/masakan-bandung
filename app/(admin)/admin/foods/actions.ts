"use server";

import { getAdminSessionFromCookies } from "@/lib/auth";
import { uploadImageToBucket } from "@/lib/supabase-server";
import { assertValidUpload, buildUploadPath } from "@/lib/uploads";

export async function uploadFoodImageAction(formData: FormData) {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("File tidak ditemukan");
  }

  const mime = assertValidUpload({ size: file.size, type: file.type });
  const path = buildUploadPath(file.name, mime);

  const { publicUrl } = await uploadImageToBucket({
    filePath: path,
    data: await file.arrayBuffer(),
    contentType: mime,
  });

  return publicUrl;
}
