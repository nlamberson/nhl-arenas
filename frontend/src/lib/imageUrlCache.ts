/** Client-side cache for resolved Firebase Storage download URLs. */
const downloadUrlByPath = new Map<string, string>();

export function getCachedDownloadUrl(storagePath: string): string | undefined {
  return downloadUrlByPath.get(storagePath);
}

export function setCachedDownloadUrl(storagePath: string, url: string): void {
  downloadUrlByPath.set(storagePath, url);
}

export function clearCachedDownloadUrl(storagePath: string): void {
  downloadUrlByPath.delete(storagePath);
}

export function clearAllCachedDownloadUrls(): void {
  downloadUrlByPath.clear();
}
