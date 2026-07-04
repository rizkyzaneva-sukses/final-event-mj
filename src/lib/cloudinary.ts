/**
 * Cloudinary helpers for Event Muda Juara
 * 
 * Upload strategy: Signed upload via API route.
 * File naming convention: {eventSlug}/{noWa}_{namaPendaftar}
 * Thumbnail transform for admin list view.
 */

import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

export interface SignatureParams {
  folder: string;
  publicId: string;
  timestamp: number;
}

/**
 * Generate a Cloudinary signed upload signature (server-side only)
 */
export function generateSignature(params: SignatureParams): string {
  const toSign = [
    `folder=${params.folder}`,
    `public_id=${params.publicId}`,
    `timestamp=${params.timestamp}`,
  ]
    .sort()
    .join("&");

  return crypto
    .createHash("sha256")
    .update(toSign + API_SECRET)
    .digest("hex");
}

/**
 * Get all params needed for client-side signed upload
 */
export function getUploadParams(eventSlug: string, noWa: string, nama: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `muda-juara/${eventSlug}`;
  // Sanitize nama for file name
  const sanitizedNama = nama
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);
  const publicId = `${noWa}_${sanitizedNama}`;

  const signature = generateSignature({ folder, publicId, timestamp });

  return {
    signature,
    timestamp,
    apiKey: API_KEY,
    cloudName: CLOUD_NAME,
    folder,
    publicId,
  };
}

/**
 * Transform a Cloudinary URL to a thumbnail for list views
 */
export function getThumbnailUrl(
  originalUrl: string,
  width = 80,
  height = 80
): string {
  if (!originalUrl) return "";
  // Insert transformation before /upload/ or /v1/
  return originalUrl.replace(
    /\/upload\//,
    `/upload/c_thumb,w_${width},h_${height},g_auto/`
  );
}

/**
 * Get full-size preview URL with auto quality
 */
export function getPreviewUrl(originalUrl: string, maxWidth = 600): string {
  if (!originalUrl) return "";
  return originalUrl.replace(
    /\/upload\//,
    `/upload/c_limit,w_${maxWidth},q_auto/`
  );
}
