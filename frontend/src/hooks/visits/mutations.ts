import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createVisit, deleteVisit, updateVisit } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { VisitCreate, VisitResponse, VisitUpdate } from '@/lib/types';

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
