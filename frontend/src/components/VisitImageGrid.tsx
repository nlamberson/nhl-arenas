import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import {
  useDeleteVisitImage,
  useUploadVisitImage,
} from '@/hooks/visits';
import { getCachedDownloadUrl } from '@/lib/imageUrlCache';
import {
  formatUploadError,
  MAX_IMAGES_PER_VISIT,
  resolveDownloadUrl,
} from '@/lib/visitImages';
import type { ImageResponse } from '@/lib/types';

function VisitImageTile({
  image,
  firebaseUid,
  onDelete,
  deleting,
}: {
  image: ImageResponse;
  firebaseUid: string;
  onDelete: (image: ImageResponse) => void;
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
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          {loadingUrl ? (
            <ActivityIndicator />
          ) : (
            <Text variant="muted" className="px-2 text-center text-xs">
              {error ?? 'Unavailable'}
            </Text>
          )}
        </View>
      )}
      <Pressable
        accessibilityLabel="Delete photo"
        disabled={deleting}
        onPress={() => onDelete(image)}
        className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60"
      >
        {deleting ? (
          <ActivityIndicator color="#fff" size="small" />
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

  const sorted = useMemo(
    () => [...images].sort((a, b) => a.slot_index - b.slot_index),
    [images],
  );
  const canAdd = sorted.length < MAX_IMAGES_PER_VISIT && Boolean(user?.uid);

  const handleAdd = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    try {
      await uploadMutation.mutateAsync({
        visitId,
        firebaseUid: user.uid,
        existingImages: sorted,
      });
    } catch (err) {
      const detail = formatUploadError(err);
      if (detail === 'Image selection cancelled') {
        return;
      }
      console.error('Image upload failed', err);
      showSnackbar({
        message: `Image failed to upload. ${detail}`,
        variant: 'error',
      });
    }
  }, [sorted, showSnackbar, uploadMutation, user?.uid, visitId]);

  const handleDelete = useCallback(
    (image: ImageResponse) => {
      const runDelete = () => {
        setDeletingId(image.id);
        void deleteMutation
          .mutateAsync({
            visitId,
            imageId: image.id,
            storagePath: image.storage_path,
          })
          .catch((err: unknown) => {
            const detail = formatUploadError(err);
            console.error('Image delete failed', err);
            showSnackbar({
              message: `Failed to delete image. ${detail}`,
              variant: 'error',
            });
          })
          .finally(() => {
            setDeletingId(null);
          });
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.confirm('Delete photo? This cannot be undone.')) {
          runDelete();
        }
        return;
      }

      Alert.alert('Delete photo?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: runDelete,
        },
      ]);
    },
    [deleteMutation, showSnackbar, visitId],
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="large">Photos</Text>
        <Text variant="muted" className="text-xs">
          {sorted.length}/{MAX_IMAGES_PER_VISIT}
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3">
        {sorted.map((image) =>
          user?.uid ? (
            <VisitImageTile
              key={image.id}
              image={image}
              firebaseUid={user.uid}
              onDelete={handleDelete}
              deleting={deletingId === image.id}
            />
          ) : null,
        )}
      </View>

      {canAdd ? (
        <Button
          variant="outline"
          disabled={uploadMutation.isPending}
          onPress={() => {
            void handleAdd();
          }}
        >
          <Text>
            {uploadMutation.isPending ? 'Uploading…' : 'Add photo'}
          </Text>
        </Button>
      ) : null}

      {uploadMutation.isPending && uploadMutation.progress != null ? (
        <Text variant="muted" className="text-center text-xs">
          {Math.round(uploadMutation.progress * 100)}%
        </Text>
      ) : null}
    </View>
  );
}
