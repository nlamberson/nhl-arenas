import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  createVisit,
  deleteVisit,
  deleteVisitImage,
  updateVisit,
} from '@/lib/api';
import {
  forgetDownloadUrl,
  uploadVisitImages,
  type UploadVisitImagesResult,
} from '@/lib/visitImages';
import { queryKeys } from '@/lib/queryKeys';
import type {
  ImageResponse,
  VisitCreate,
  VisitResponse,
  VisitUpdate,
} from '@/lib/types';

export type UploadBatchProgress = {
  completed: number;
  total: number;
};

export function useCreateVisit(options?: {
  onSuccess?: (visit: VisitResponse) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VisitCreate) => createVisit(payload),
    onSuccess: async (created) => {
      queryClient.setQueryData(queryKeys.visits.detail(created.id), created);
      await queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      options?.onSuccess?.(created);
    },
  });
}

export function useUpdateVisit(options?: {
  onSuccess?: (visit: VisitResponse) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VisitUpdate }) =>
      updateVisit(id, payload),
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKeys.visits.detail(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      options?.onSuccess?.(updated);
    },
  });
}

export function useDeleteVisit(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVisit(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.visits.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      options?.onSuccess?.();
    },
  });
}

function mergeImageIntoVisitCache(
  queryClient: ReturnType<typeof useQueryClient>,
  visitId: string,
  image: ImageResponse,
) {
  queryClient.setQueryData<VisitResponse | undefined>(
    queryKeys.visits.detail(visitId),
    (current) => {
      if (!current) {
        return current;
      }
      const existing = current.images ?? [];
      if (existing.some((img) => img.id === image.id)) {
        return current;
      }
      return { ...current, images: [...existing, image] };
    },
  );
}

function removeImageFromVisitCache(
  queryClient: ReturnType<typeof useQueryClient>,
  visitId: string,
  imageId: string,
) {
  queryClient.setQueryData<VisitResponse | undefined>(
    queryKeys.visits.detail(visitId),
    (current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        images: (current.images ?? []).filter((img) => img.id !== imageId),
      };
    },
  );
}

export function useUploadVisitImage() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadBatchProgress | null>(null);

  const mutation = useMutation({
    mutationFn: (params: {
      visitId: string;
      firebaseUid: string;
      existingImages: ImageResponse[];
      uris: string[];
    }) => {
      setProgress({ completed: 0, total: params.uris.length });
      return uploadVisitImages({
        ...params,
        onItemComplete: ({ completed, total, image }) => {
          mergeImageIntoVisitCache(queryClient, params.visitId, image);
          setProgress({ completed, total });
        },
      });
    },
    onSuccess: async (result: UploadVisitImagesResult, vars) => {
      // Let the bar animate to the final step before dismissing the toast.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setProgress(null);
      if (result.succeeded.length > 0) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.visits.detail(vars.visitId),
        });
      }
    },
    onError: () => {
      setProgress(null);
    },
  });

  return { ...mutation, progress };
}

export function useDeleteVisitImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      visitId: string;
      imageId: string;
      storagePath: string;
    }) => {
      await deleteVisitImage(params.visitId, params.imageId);
      await forgetDownloadUrl(params.storagePath);
    },
    onSuccess: async (_data, vars) => {
      removeImageFromVisitCache(queryClient, vars.visitId, vars.imageId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.visits.detail(vars.visitId),
      });
    },
  });
}
