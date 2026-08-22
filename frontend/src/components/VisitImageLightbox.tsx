import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getCachedDownloadUrl } from '@/lib/imageUrlCache';
import type { ImageResponse } from '@/lib/types';
import { formatUploadError, resolveDownloadUrl } from '@/lib/visitImages';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const EMPTY_IMAGES: ImageResponse[] = [];

const zoomTiming = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
};

/**
 * Web: solid scrim only — live `backdrop-filter` is the main source of lightbox
 * jank on desktop and mobile browsers when the visit page (images, layout) sits behind.
 * Native: modest BlurView.
 */
function LightboxBackdrop() {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.82)', pointerEvents: 'none' }]}
      />
    );
  }

  return (
    <BlurView
      intensity={40}
      tint="dark"
      blurMethod="dimezisBlurView"
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
    />
  );
}

function containedSize(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (imageWidth <= 0 || imageHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  return {
    width: Math.max(1, imageWidth * scale),
    height: Math.max(1, imageHeight * scale),
  };
}

function ZoomableImage({
  uri,
  width,
  height,
  onNaturalSize,
}: {
  uri: string;
  width: number;
  height: number;
  onNaturalSize: (size: { width: number; height: number }) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [uri, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const resetTransform = () => {
    'worklet';
    scale.value = withTiming(1, zoomTiming);
    translateX.value = withTiming(0, zoomTiming);
    translateY.value = withTiming(0, zoomTiming);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= 1.05) {
        resetTransform();
        return;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1) {
        return;
      }
      const maxX = (width * (scale.value - 1)) / 2;
      const maxY = (height * (scale.value - 1)) / 2;
      translateX.value = Math.min(
        Math.max(savedTranslateX.value + event.translationX, -maxX),
        maxX,
      );
      translateY.value = Math.min(
        Math.max(savedTranslateY.value + event.translationY, -maxY),
        maxY,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        resetTransform();
        return;
      }
      scale.value = withTiming(DOUBLE_TAP_SCALE, zoomTiming);
      savedScale.value = DOUBLE_TAP_SCALE;
    });

  const composed = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    width,
    height,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={animatedStyle}
        collapsable={false}
        needsOffscreenAlphaCompositing={Platform.OS !== 'web'}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      >
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          onLoad={(event) => {
            const src = event.source;
            if (src?.width && src?.height) {
              onNaturalSize({ width: src.width, height: src.height });
            }
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
}

function LightboxImage({
  image,
  firebaseUid,
  maxWidth,
  maxHeight,
}: {
  image: ImageResponse;
  firebaseUid: string;
  maxWidth: number;
  maxHeight: number;
}) {
  const cached = getCachedDownloadUrl(image.storage_path);
  const [url, setUrl] = useState<string | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setNaturalSize(null);
    const nextCached = getCachedDownloadUrl(image.storage_path);
    if (nextCached) {
      setUrl(nextCached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
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
          setUrl(null);
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

  const displaySize = useMemo(() => {
    if (!naturalSize) {
      return { width: Math.max(1, maxWidth), height: Math.max(1, maxHeight) };
    }
    return containedSize(naturalSize.width, naturalSize.height, maxWidth, maxHeight);
  }, [naturalSize, maxWidth, maxHeight]);

  if (!url) {
    return (
      <View
        style={{
          width: maxWidth,
          height: maxHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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

  return (
    <ZoomableImage
      uri={url}
      width={displaySize.width}
      height={displaySize.height}
      onNaturalSize={setNaturalSize}
    />
  );
}

function usePrefetchNeighborUrls(
  images: ImageResponse[],
  index: number,
  firebaseUid: string,
) {
  const neighborKey =
    images.length === 0
      ? ''
      : [
          images[index],
          images[(index + 1) % images.length],
          images[(index - 1 + images.length) % images.length],
        ]
          .map((img) => img.storage_path)
          .join('|');

  useEffect(() => {
    if (!neighborKey) {
      return;
    }
    const uniquePaths = [...new Set(neighborKey.split('|'))];

    let cancelled = false;
    void (async () => {
      for (const path of uniquePaths) {
        if (cancelled) {
          return;
        }
        try {
          const url = await resolveDownloadUrl(path, firebaseUid);
          if (!cancelled) {
            await Image.prefetch(url, 'memory-disk');
          }
        } catch {
          // Prefetch is best-effort.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUid, neighborKey]);
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
  const [displayIndex, setDisplayIndex] = useState(index);
  const count = images.length;
  const safeIndex = count === 0 ? 0 : ((displayIndex % count) + count) % count;
  const current = count > 0 ? images[safeIndex] : null;
  const showChevrons = count > 1;

  const paddingTop = Math.max(insets.top, 12) + 56;
  const paddingBottom = Math.max(insets.bottom, 12) + 24;
  const paddingHorizontal = showChevrons ? 64 : 16;
  const imageMaxWidth = Math.max(1, windowWidth - paddingHorizontal * 2);
  const imageMaxHeight = Math.max(1, windowHeight - paddingTop - paddingBottom);

  useEffect(() => {
    if (visible) {
      setDisplayIndex(index);
    }
  }, [index, visible]);

  usePrefetchNeighborUrls(visible ? images : EMPTY_IMAGES, safeIndex, firebaseUid);

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

  if (!current) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/*
          Same dismiss pattern as DeleteVisitConfirmation: outer Pressable closes,
          inner photo/controls stopPropagation. Photo is sized to its contained
          rect so letterbox / open space hits the outer dismiss (needed on web).
        */}
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no"
          onPress={onClose}
          style={{
            width: windowWidth,
            height: windowHeight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <LightboxBackdrop />

          <View
            style={{
              position: 'absolute',
              zIndex: 20,
              top: Math.max(insets.top, 12) + 12,
              left: 0,
              right: 0,
              alignItems: 'center',
              pointerEvents: 'none',
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
            onPress={(event) => {
              event.stopPropagation?.();
              onClose();
            }}
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
              onPress={(event) => {
                event.stopPropagation?.();
                goPrev();
              }}
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
              onPress={(event) => {
                event.stopPropagation?.();
                goNext();
              }}
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

          <Pressable
            onPress={(event) => {
              event.stopPropagation?.();
            }}
          >
            <LightboxImage
              image={current}
              firebaseUid={firebaseUid}
              maxWidth={imageMaxWidth}
              maxHeight={imageMaxHeight}
            />
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}
