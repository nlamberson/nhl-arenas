import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getCachedDownloadUrl } from '@/lib/imageUrlCache';
import { formatUploadError, resolveDownloadUrl } from '@/lib/visitImages';
import type { ImageResponse } from '@/lib/types';

const EXIT_MS = 180;

function LightboxImage({
  image,
  firebaseUid,
}: {
  image: ImageResponse;
  firebaseUid: string;
}) {
  const cached = getCachedDownloadUrl(image.storage_path);
  const [url, setUrl] = useState<string | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nextCached = getCachedDownloadUrl(image.storage_path);
    if (nextCached) {
      setUrl(nextCached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setUrl(null);
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
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [firebaseUid, image.storage_path]);

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        transition={200}
      />
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="px-4 text-center text-sm text-white">
          {error ?? 'Unavailable'}
        </Text>
      )}
    </View>
  );
}

export function VisitImageLightbox({
  images,
  index,
  visible,
  firebaseUid,
  onClose,
  onIndexChange,
}: {
  images: ImageResponse[];
  index: number;
  visible: boolean;
  firebaseUid: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(index);
  const count = images.length;
  const safeIndex = count === 0 ? 0 : ((displayIndex % count) + count) % count;
  const current = count > 0 ? images[safeIndex] : null;
  const showChevrons = count > 1;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setDisplayIndex(index);
    }
  }, [index, visible]);

  const goPrev = () => {
    if (count <= 1) {
      return;
    }
    onIndexChange((safeIndex - 1 + count) % count);
  };

  const goNext = () => {
    if (count <= 1) {
      return;
    }
    onIndexChange((safeIndex + 1) % count);
  };

  if (!mounted || !current) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      {visible ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(EXIT_MS)}
          style={{ width: windowWidth, height: windowHeight }}
        >
          <BlurView
            intensity={80}
            tint="dark"
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                zIndex: 20,
                top: Math.max(insets.top, 12) + 12,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: '#f8fafc' }}
                accessibilityLabel={`Image ${safeIndex + 1} of ${count}`}
              >
                {safeIndex + 1}/{count}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Close enlarged image"
              onPress={onClose}
              className="absolute z-20 h-11 w-11 items-center justify-center rounded-full bg-black/50"
              style={{
                top: Math.max(insets.top, 12) + 4,
                right: Math.max(insets.right, 12) + 4,
              }}
            >
              <Icon as={X} size={22} className="text-white" />
            </Pressable>

            {showChevrons ? (
              <Pressable
                accessibilityLabel="Previous image"
                onPress={goPrev}
                className="absolute z-20 h-12 w-12 items-center justify-center rounded-full bg-black/50"
                style={{
                  left: Math.max(insets.left, 12),
                  top: '50%',
                  marginTop: -24,
                }}
              >
                <Icon as={ChevronLeft} size={28} className="text-white" />
              </Pressable>
            ) : null}

            {showChevrons ? (
              <Pressable
                accessibilityLabel="Next image"
                onPress={goNext}
                className="absolute z-20 h-12 w-12 items-center justify-center rounded-full bg-black/50"
                style={{
                  right: Math.max(insets.right, 12),
                  top: '50%',
                  marginTop: -24,
                }}
              >
                <Icon as={ChevronRight} size={28} className="text-white" />
              </Pressable>
            ) : null}

            <Animated.View
              entering={ZoomIn.duration(220).springify().damping(18)}
              exiting={ZoomOut.duration(EXIT_MS)}
              style={{
                flex: 1,
                width: '100%',
                paddingTop: Math.max(insets.top, 12) + 56,
                paddingBottom: Math.max(insets.bottom, 12) + 24,
                paddingHorizontal: showChevrons ? 64 : 16,
              }}
            >
              <LightboxImage
                key={current.id}
                image={current}
                firebaseUid={firebaseUid}
              />
            </Animated.View>
          </View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}
