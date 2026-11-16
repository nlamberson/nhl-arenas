import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { AlertDialog } from "@/components/ui/gluestack/alert-dialog";
import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/gluestack/pressable";
import { Spinner } from "@/components/ui/gluestack/spinner";
import { Text } from "@/components/ui/gluestack/text";
import { Toast, useToast } from "@/components/ui/gluestack/toast";
import { VisitImageLightbox } from "@/components/visits/VisitImageLightbox";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { useDeleteVisitImage, useUploadVisitImage } from "@/hooks/visits";
import { getCachedDownloadUrl } from "@/lib/imageUrlCache";
import {
  formatUploadError,
  MAX_IMAGES_ERROR,
  MAX_IMAGES_PER_VISIT,
  pickVisitImageUris,
  resolveDownloadUrl,
} from "@/lib/visitImages";
import type { ImageResponse } from "@/lib/types";

function UploadProgressToast({
  completed,
  total,
  visible,
}: {
  completed: number;
  total: number;
  visible: boolean;
}) {
  const toast = useToast();
  const progress = total > 0 ? Math.min((completed / total) * 100, 100) : 0;

  useEffect(() => {
    if (!visible || total <= 0) {
      return undefined;
    }

    const id = toast.show({
      placement: "bottom",
      duration: null,
      render: () => (
        <Toast className="w-full max-w-lg gap-2 rounded-xl border border-border bg-background-800 px-4 py-3.5">
          <Toast.Description className="text-center text-sm font-medium text-white">
            Uploading {completed}/{total}
          </Toast.Description>
          <View className="h-2 w-full overflow-hidden rounded-full bg-background-600">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${progress}%` }}
            />
          </View>
        </Toast>
      ),
    });
    return () => toast.close(id);
  }, [completed, progress, toast, total, visible]);

  return null;
}

function VisitImageTile({
  image,
  firebaseUid,
  onDelete,
  onOpen,
  deleting,
}: {
  image: ImageResponse;
  firebaseUid: string;
  onDelete: (image: ImageResponse) => void;
  onOpen: () => void;
  deleting: boolean;
}) {
  const cached = getCachedDownloadUrl(image.storage_path);
  const [url, setUrl] = useState<string | null>(cached ?? null);
  const [loadingUrl, setLoadingUrl] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (cached) {
      return;
    }
    setLoadingUrl(true);
    setError(null);
    resolveDownloadUrl(image.storage_path, firebaseUid)
      .then((resolved) => {
        if (!cancelled) {
          setUrl(resolved);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(formatUploadError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUrl(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cached, firebaseUid, image.storage_path]);

  return (
    <View className="relative aspect-square w-[47%] overflow-hidden rounded-lg bg-muted/30">
      <Pressable
        accessibilityLabel="Enlarge photo"
        disabled={!url}
        onPress={onOpen}
        className="h-full w-full"
      >
        {url ? (
          <Image
            source={{ uri: url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            {loadingUrl ? (
              <Spinner />
            ) : (
              <Text size="xs" className="px-2 text-center text-typography-500">
                {error ?? "Unavailable"}
              </Text>
            )}
          </View>
        )}
      </Pressable>
      <Pressable
        accessibilityLabel="Delete photo"
        disabled={deleting}
        onPress={() => onDelete(image)}
        className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60"
      >
        {deleting ? (
          <Spinner color="#fff" size="small" />
        ) : (
          <Icon as={X} size={16} className="text-white" />
        )}
      </Pressable>
    </View>
  );
}

export function VisitImageGrid({
  visitId,
  images,
}: {
  visitId: string;
  images: ImageResponse[];
}) {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const uploadMutation = useUploadVisitImage();
  const deleteMutation = useDeleteVisitImage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ImageResponse | null>(null);

  const sorted = useMemo(
    () => [...images].sort((a, b) => a.slot_index - b.slot_index),
    [images],
  );
  const canAdd = sorted.length < MAX_IMAGES_PER_VISIT && Boolean(user?.uid);
  const busy = picking || uploadMutation.isPending;

  const handleAdd = useCallback(async () => {
    if (!user?.uid || busy) {
      return;
    }

    const remaining = MAX_IMAGES_PER_VISIT - sorted.length;
    if (remaining <= 0) {
      showSnackbar({ message: MAX_IMAGES_ERROR, variant: "error" });
      return;
    }

    setPicking(true);
    try {
      const uris = await pickVisitImageUris({ selectionLimit: remaining });
      if (!uris) {
        return;
      }

      if (sorted.length + uris.length > MAX_IMAGES_PER_VISIT) {
        showSnackbar({ message: MAX_IMAGES_ERROR, variant: "error" });
        return;
      }

      const result = await uploadMutation.mutateAsync({
        visitId,
        firebaseUid: user.uid,
        existingImages: sorted,
        uris,
      });

      if (result.failures.length === 0) {
        return;
      }

      const firstDetail = formatUploadError(result.failures[0]?.error);
      if (result.failures.length === 1) {
        showSnackbar({
          message: `Image failed to upload. ${firstDetail}`,
          variant: "error",
        });
        return;
      }

      showSnackbar({
        message: `${result.failures.length} images failed to upload. ${firstDetail}`,
        variant: "error",
      });
    } catch (err) {
      const detail = formatUploadError(err);
      if (detail === MAX_IMAGES_ERROR) {
        showSnackbar({ message: MAX_IMAGES_ERROR, variant: "error" });
        return;
      }
      console.error("Image upload failed", err);
      showSnackbar({
        message: `Image failed to upload. ${detail}`,
        variant: "error",
      });
    } finally {
      setPicking(false);
    }
  }, [busy, showSnackbar, sorted, uploadMutation, user?.uid, visitId]);

  const handleDelete = useCallback((image: ImageResponse) => {
    setImageToDelete(image);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!imageToDelete || deletingId) {
      return;
    }

    setDeletingId(imageToDelete.id);
    try {
      await deleteMutation.mutateAsync({
        visitId,
        imageId: imageToDelete.id,
        storagePath: imageToDelete.storage_path,
      });
    } catch (err) {
      const detail = formatUploadError(err);
      console.error("Image delete failed", err);
      showSnackbar({
        message: `Failed to delete image. ${detail}`,
        variant: "error",
      });
    } finally {
      setDeletingId(null);
      setImageToDelete(null);
    }
  }, [deleteMutation, deletingId, imageToDelete, showSnackbar, visitId]);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text size="lg" bold>
          Photos
        </Text>
        <Text size="xs" className="text-typography-500">
          {sorted.length}/{MAX_IMAGES_PER_VISIT}
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3">
        {sorted.map((image, index) =>
          user?.uid ? (
            <VisitImageTile
              key={image.id}
              image={image}
              firebaseUid={user.uid}
              onDelete={handleDelete}
              onOpen={() => setLightboxIndex(index)}
              deleting={deletingId === image.id}
            />
          ) : null,
        )}
      </View>

      {canAdd ? (
        <Button
          variant="outline"
          action="primary"
          size="md"
          isDisabled={busy}
          onPress={() => {
            void handleAdd();
          }}
        >
          <ButtonText>
            {uploadMutation.isPending ? "Uploading…" : "Add photo"}
          </ButtonText>
        </Button>
      ) : null}

      <AlertDialog
        isOpen={imageToDelete !== null}
        onClose={() => {
          if (!deletingId) {
            setImageToDelete(null);
          }
        }}
        closeOnOverlayClick={!deletingId}
      >
        <AlertDialog.Backdrop className="absolute inset-0 bg-black/50" />
        <AlertDialog.Content className="w-full max-w-sm gap-5 rounded-xl border border-border bg-background px-5 py-6">
          <AlertDialog.Body className="gap-2">
            <Text size="md" bold className="text-center">
              Delete photo?
            </Text>
            <Text size="sm" className="text-center text-typography-500">
              This cannot be undone.
            </Text>
          </AlertDialog.Body>
          <AlertDialog.Footer className="gap-3">
            <Button
              action="negative"
              variant="solid"
              onPress={() => void confirmDelete()}
              isDisabled={Boolean(deletingId)}
            >
              {deletingId ? (
                <ButtonSpinner />
              ) : (
                <ButtonText>Delete</ButtonText>
              )}
            </Button>
            <Button
              action="primary"
              variant="outline"
              onPress={() => setImageToDelete(null)}
              isDisabled={Boolean(deletingId)}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>

      <UploadProgressToast
        visible={Boolean(uploadMutation.progress)}
        completed={uploadMutation.progress?.completed ?? 0}
        total={uploadMutation.progress?.total ?? 0}
      />

      {user?.uid ? (
        <VisitImageLightbox
          images={sorted}
          index={lightboxIndex ?? 0}
          visible={lightboxIndex != null}
          firebaseUid={user.uid}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </View>
  );
}
