import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

import { createVisitImage } from '@/lib/api';
import { getFirebaseStorage } from '@/lib/firebase';
import { ensureFirebaseStorageAuth } from '@/lib/firebaseStorageAuth';
import {
  clearCachedDownloadUrl,
  getCachedDownloadUrl,
  setCachedDownloadUrl,
} from '@/lib/imageUrlCache';
import type { ImageResponse } from '@/lib/types';

export const MAX_IMAGES_PER_VISIT = 5;
const MAX_EDGE_PX = 1600;
const COMPRESS_QUALITY = 0.75;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function nextFreeSlotIndex(images: ImageResponse[]): number | null {
  const taken = new Set(images.map((img) => img.slot_index));
  for (let slot = 0; slot < MAX_IMAGES_PER_VISIT; slot += 1) {
    if (!taken.has(slot)) {
      return slot;
    }
  }
  return null;
}

export function buildStoragePath(
  firebaseUid: string,
  visitId: string,
  slotIndex: number,
  ext: string,
): string {
  return `visits/${firebaseUid}/${visitId}/${slotIndex}.${ext}`;
}

export function formatUploadError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: string; name?: string };
    if (e.code || e.message) {
      return [e.code, e.message].filter(Boolean).join(': ');
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Upload failed';
}

export async function resolveDownloadUrl(
  storagePath: string,
  firebaseUid: string,
): Promise<string> {
  const cached = getCachedDownloadUrl(storagePath);
  if (cached) {
    return cached;
  }
  await ensureFirebaseStorageAuth(firebaseUid);
  const url = await getDownloadURL(ref(getFirebaseStorage(), storagePath));
  setCachedDownloadUrl(storagePath, url);
  return url;
}

export async function pickVisitImageUri(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to add images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }
  return result.assets[0].uri;
}

async function compressImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
  ext: string;
}> {
  // Resize so the longest edge is at most MAX_EDGE_PX (width-only would upscale portraits).
  const probe = await ImageManipulator.manipulateAsync(uri, []);
  const { width, height } = probe;
  const longest = Math.max(width, height);
  const actions: ImageManipulator.Action[] =
    longest > MAX_EDGE_PX
      ? width >= height
        ? [{ resize: { width: MAX_EDGE_PX } }]
        : [{ resize: { height: MAX_EDGE_PX } }]
      : [];

  const manipulated = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: COMPRESS_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: manipulated.uri,
    mimeType: 'image/jpeg',
    ext: 'jpg',
  };
}

/**
 * Read local/picker URI into bytes. Prefer ArrayBuffer over Blob — RN Blobs often
 * break Firebase `uploadBytesResumable` (hang or empty upload).
 */
async function uriToBytes(uri: string): Promise<Uint8Array> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read image file (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export type UploadProgressHandler = (progress: number) => void;

/**
 * Pick → compress → upload to Storage → POST metadata.
 * If metadata POST fails, deletes the Storage object to avoid orphans.
 */
export async function uploadVisitImage(params: {
  visitId: string;
  firebaseUid: string;
  existingImages: ImageResponse[];
  onProgress?: UploadProgressHandler;
}): Promise<ImageResponse> {
  const { visitId, firebaseUid, existingImages, onProgress } = params;

  if (existingImages.length >= MAX_IMAGES_PER_VISIT) {
    throw new Error(`A visit can have at most ${MAX_IMAGES_PER_VISIT} images.`);
  }

  const slotIndex = nextFreeSlotIndex(existingImages);
  if (slotIndex === null) {
    throw new Error(`A visit can have at most ${MAX_IMAGES_PER_VISIT} images.`);
  }

  console.log('[visitImages] picking image…');
  const pickedUri = await pickVisitImageUri();
  if (!pickedUri) {
    throw new Error('Image selection cancelled');
  }

  console.log('[visitImages] compressing…');
  const compressed = await compressImage(pickedUri);
  const storagePath = buildStoragePath(
    firebaseUid,
    visitId,
    slotIndex,
    compressed.ext,
  );

  console.log('[visitImages] ensuring Firebase Auth for Storage…');
  await ensureFirebaseStorageAuth(firebaseUid);

  console.log('[visitImages] uploading to', storagePath);
  const storageRef = ref(getFirebaseStorage(), storagePath);
  const bytes = await uriToBytes(compressed.uri);

  try {
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, bytes, {
        contentType: compressed.mimeType,
      });
      task.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes);
          }
        },
        (error) => {
          console.error('[visitImages] Storage upload failed', error);
          reject(error);
        },
        () => resolve(),
      );
    });

    console.log('[visitImages] posting metadata to API…');
    try {
      return await createVisitImage(visitId, {
        storage_path: storagePath,
        slot_index: slotIndex,
        mime_type: compressed.mimeType,
        file_size: bytes.byteLength,
      });
    } catch (metadataError) {
      try {
        await deleteObject(storageRef);
      } catch {
        // Best-effort orphan cleanup; surface the metadata error.
      }
      throw metadataError;
    }
  } finally {
    // no-op
  }
}

export async function forgetDownloadUrl(storagePath: string): Promise<void> {
  clearCachedDownloadUrl(storagePath);
}

export function extensionForMime(mimeType: string): string | undefined {
  return MIME_TO_EXT[mimeType.toLowerCase()];
}
