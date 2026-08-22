import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitImageLightbox } from '@/components/VisitImageLightbox';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import {
  useDeleteVisitImage,
  useUploadVisitImage,
} from '@/hooks/visits';
import { getCachedDownloadUrl } from '@/lib/imageUrlCache';
import {
  formatUploadError,
  MAX_IMAGES_ERROR,
  MAX_IMAGES_PER_VISIT,
  pickVisitImageUris,
  resolveDownloadUrl,
} from '@/lib/visitImages';
import type { ImageResponse } from '@/lib/types';

/** Matches app `--primary` (hsl 199 89% 48%). NativeWind classes often miss Reanimated views. */
const PROGRESS_FILL = '#0ea5e9';
const PROGRESS_TRACK = '#334155';

function UploadProgressToast({
  completed,
  total,
  visible,
}: {
  completed: number;
  total: number;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0 || total <= 0) {
      return;
    }
    fillWidth.value = withTiming((completed / total) * trackWidth, {
      duration: 350,
    });
  }, [completed, fillWidth, total, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View
        pointerEvents="box-none"
        className="flex-1 justify-end"
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
      >
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(150)}
          className="mx-4 rounded-xl px-4 py-3.5"
          style={{
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: '#334155',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text
            className="mb-2 text-center text-sm font-medium"
            style={{ color: '#f8fafc' }}
          >
            Uploading {completed}/{total}
          </Text>
          <View
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: PROGRESS_TRACK }}
            onLayout={(event) => {
              setTrackWidth(event.nativeEvent.layout.width);
            }}
          >
            <Animated.View
              style={[
                {
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: PROGRESS_FILL,
                },
                fillStyle,
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
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
      </Pressable>
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
  const [picking, setPicking] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
      showSnackbar({ message: MAX_IMAGES_ERROR, variant: 'error' });
      return;
    }

    setPicking(true);
    try {
      const uris = await pickVisitImageUris({ selectionLimit: remaining });
      if (!uris) {
        return;
      }

      if (sorted.length + uris.length > MAX_IMAGES_PER_VISIT) {
        showSnackbar({ message: MAX_IMAGES_ERROR, variant: 'error' });
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
          variant: 'error',
        });
        return;
      }

      showSnackbar({
        message: `${result.failures.length} images failed to upload. ${firstDetail}`,
        variant: 'error',
      });
    } catch (err) {
      const detail = formatUploadError(err);
      if (detail === MAX_IMAGES_ERROR) {
        showSnackbar({ message: MAX_IMAGES_ERROR, variant: 'error' });
        return;
      }
      console.error('Image upload failed', err);
      showSnackbar({
        message: `Image failed to upload. ${detail}`,
        variant: 'error',
      });
    } finally {
      setPicking(false);
    }
  }, [busy, showSnackbar, sorted, uploadMutation, user?.uid, visitId]);

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
          disabled={busy}
          onPress={() => {
            void handleAdd();
          }}
        >
          <Text>
            {uploadMutation.isPending ? 'Uploading…' : 'Add photo'}
          </Text>
        </Button>
      ) : null}

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
