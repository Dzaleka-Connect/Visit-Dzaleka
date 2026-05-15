import { apiRequest } from "@/lib/queryClient";

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type AvatarUploadPurpose = "user_avatar" | "guide_profile";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image"));
    reader.readAsDataURL(file);
  });
}

export function validateProfileImage(file: File) {
  if (!ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, WEBP, or GIF image.");
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Please upload an image smaller than 5 MB.");
  }
}

export async function uploadAvatarImage(file: File, purpose: AvatarUploadPurpose) {
  validateProfileImage(file);
  const dataUrl = await readFileAsDataUrl(file);
  const response = await apiRequest("POST", "/api/uploads/avatar", {
    purpose,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    dataUrl,
  });

  return response.json() as Promise<{ path: string; publicUrl: string }>;
}
