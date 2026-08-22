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
export const MAX_IMAGES_ERROR = 'max 5 images';

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

export async function pickVisitImageUris(params: {
  selectionLimit: number;
}): Promise<string[] | null> {
  const selectionLimit = Math.max(1, Math.floor(params.selectionLimit));
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to add images.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    allowsMultipleSelection: true,
    selectionLimit,
    quality: 1,
  });

  if (result.canceled || !result.assets.length) {
    return null;
  }

  const uris = result.assets
    .map((asset) => asset.uri)
    .filter((uri): uri is string => Boolean(uri));
  return uris.length > 0 ? uris : null;
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

/**
 * Compress → upload to Storage → POST metadata.
 * If metadata POST fails, deletes the Storage object to avoid orphans.
 */
export async function uploadVisitImageFromUri(params: {
  uri: string;
  visitId: string;
  firebaseUid: string;
  slotIndex: number;
}): Promise<ImageResponse> {
  const { uri, visitId, firebaseUid, slotIndex } = params;

  console.log('[visitImages] compressing…');
  const compressed = await compressImage(uri);
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

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, bytes, {
      contentType: compressed.mimeType,
    });
    task.on(
      'state_changed',
      () => {
        // Progress is tracked per completed image at the batch level.
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
}

export type UploadItemCompleteHandler = (info: {
  completed: number;
  total: number;
  image: ImageResponse;
}) => void;

export type UploadVisitImagesResult = {
  succeeded: ImageResponse[];
  failures: { uri: string; error: unknown }[];
};

/**
 * Upload multiple pre-picked URIs sequentially, assigning free slots as we go.
 * Advances progress only after each successful metadata POST.
 */
export async function uploadVisitImages(params: {
  uris: string[];
  visitId: string;
  firebaseUid: string;
  existingImages: ImageResponse[];
  onItemComplete?: UploadItemCompleteHandler;
}): Promise<UploadVisitImagesResult> {
  const { uris, visitId, firebaseUid, existingImages, onItemComplete } = params;
  const total = uris.length;

  if (total === 0) {
    return { succeeded: [], failures: [] };
  }

  if (existingImages.length + total > MAX_IMAGES_PER_VISIT) {
    throw new Error(MAX_IMAGES_ERROR);
  }

  const workingImages = [...existingImages];
  const succeeded: ImageResponse[] = [];
  const failures: { uri: string; error: unknown }[] = [];

  for (const uri of uris) {
    const slotIndex = nextFreeSlotIndex(workingImages);
    if (slotIndex === null) {
      failures.push({ uri, error: new Error(MAX_IMAGES_ERROR) });
      continue;
    }

    try {
      const image = await uploadVisitImageFromUri({
        uri,
        visitId,
        firebaseUid,
        slotIndex,
      });
      workingImages.push(image);
      succeeded.push(image);
      onItemComplete?.({
        completed: succeeded.length,
        total,
        image,
      });
    } catch (error) {
      console.error('[visitImages] image upload failed', error);
      failures.push({ uri, error });
    }
  }

  return { succeeded, failures };
}

export async function forgetDownloadUrl(storagePath: string): Promise<void> {
  clearCachedDownloadUrl(storagePath);
}

export function extensionForMime(mimeType: string): string | undefined {
  return MIME_TO_EXT[mimeType.toLowerCase()];
}
