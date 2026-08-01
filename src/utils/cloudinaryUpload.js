// Shared by FileAttachment.jsx (item file column) and UpdatePanel.jsx
// (Updates/comments attachments) — extracted from FileAttachment's
// original inline implementation during the Phase 6 Supabase migration,
// which needed UpdatePanel's uploads to go through the same real
// Cloudinary pipeline instead of ephemeral blob URLs.
const CLOUDINARY_CLOUD = "lawjar8t";
const CLOUDINARY_UPLOAD_PRESET = "rcs_upload";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class FileTooLargeError extends Error {}

// Cloudinary serves PDFs/ZIPs uploaded as "image" resource type with a 401
// by default (a security restriction on this account's Cloudinary plan) —
// routing non-image/video files through "raw" instead avoids that
// restriction entirely, since it doesn't apply to raw delivery.
export async function uploadToCloudinary(file) {
  if (!file) return null;
  if (file.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError(`File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const isImageOrVideo = file.type.startsWith("image/") || file.type.startsWith("video/");
  const resourceType = isImageOrVideo ? "auto" : "raw";

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error(data?.error?.message || "Upload failed");
  }

  return {
    url: data.secure_url,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  };
}
